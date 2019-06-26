module Stellerator.Model exposing
    ( AudioEmulation(..)
    , Cartridge
    , CartridgeType
    , CartridgeViewMode(..)
    , ChangeCartridgeMsg(..)
    , CpuEmulation(..)
    , EmulationState(..)
    , Media(..)
    , Model
    , Msg(..)
    , Route(..)
    , TvMode(..)
    , cartridgesMatchingSearch
    , decodeCartridge
    , decodeCartridgeType
    , nextCartridge
    , previousCartridge
    , selectionInSearchResults
    )

import Browser.Navigation as Nav
import Json.Decode as Decode exposing (..)
import Json.Decode.Pipeline exposing (optional, required)
import List.Extra as LE



-- MODEL DEFINITION


type Route
    = Cartridges
    | Settings
    | Emulation
    | Help


type Media
    = Narrow
    | Wide


type EmulationState
    = Stopped
    | Paused
    | Running (Maybe Float)


type TvMode
    = PAL
    | NTSC
    | SECAM


type CpuEmulation
    = Cycle
    | Instruction


type AudioEmulation
    = Waveform
    | PCM


type CartridgeViewMode
    = CartridgeViewCartridges
    | CartridgeViewSettings


type alias Cartridge =
    { hash : String
    , name : String
    , cartridgeType : String
    , tvMode : TvMode
    , emulatePaddles : Bool
    , rngSeed : Maybe Int
    , firstVisibleLine : Maybe Int
    , cpuEmulation : Maybe CpuEmulation
    , audioEmulation : Maybe AudioEmulation
    , volume : Int
    }


type alias CartridgeType =
    { key : String
    , description : String
    }


type alias Model =
    { key : Nav.Key
    , currentRoute : Route
    , media : Maybe Media
    , emulationState : EmulationState
    , helppage : Maybe String
    , sideMenu : Bool
    , cartridges : List Cartridge
    , currentCartridgeHash : Maybe String
    , cartridgeTypes : List CartridgeType
    , cartridgeFilter : String
    , cartridgeViewMode : CartridgeViewMode
    }



-- MESSAGE


type ChangeCartridgeMsg
    = ChangeCartridgeName String
    | ChangeCartridgeType String
    | ChangeCartridgeTvMode TvMode
    | ChangeCartridgeEmulatePaddles Bool
    | ChangeCartridgeRngSeed (Maybe Int)
    | ChangeCartridgeFirstVisibleLine (Maybe Int)
    | ChangeCartridgeCpuEmulation (Maybe CpuEmulation)
    | ChangeCartridgeAudioEmulation (Maybe AudioEmulation)
    | ChangeCartridgeVolume Int


type Msg
    = NavigateToUrl String
    | ChangeRoute Route
    | ChangeMedia Media
    | SetHelpPage String
    | ToggleSideMenu
    | ChangeCartridgeFilter String
    | ClearCartridgeFilter
    | SelectCartridge String
    | SelectNextCartridgeMatchingSearch String
    | SelectPreviousCartridgeMatchingSearch String
    | SelectFirstCartridgeMatchingSearch
    | SelectLastCartridgeMatchingSearch
    | ClearSelectedCartridge
    | DeleteCartridge String
    | ChangeCartridge String ChangeCartridgeMsg
    | ChangeCartridgeViewMode CartridgeViewMode
    | AddCartridge
    | None



-- HELPERS AND SELECTORS


cartridgesMatchingSearch : Model -> List Cartridge
cartridgesMatchingSearch model =
    let
        filterWords =
            model.cartridgeFilter |> String.toUpper |> String.words
    in
    List.filter
        (\c -> List.all (\w -> String.contains w <| String.toUpper c.name) filterWords)
        model.cartridges


selectionInSearchResults : Model -> Maybe String
selectionInSearchResults model =
    model.currentCartridgeHash
        |> Maybe.andThen
            (\h -> LE.find (\c -> c.hash == h) <| cartridgesMatchingSearch model)
        >> Maybe.map (\c -> c.hash)


nextCartridge : List Cartridge -> String -> Maybe Cartridge
nextCartridge cartridges hash =
    let
        next_ c =
            case c of
                h1 :: h2 :: tail ->
                    if h1.hash == hash then
                        Just h2

                    else
                        next_ <| h2 :: tail

                _ ->
                    List.head cartridges
    in
    next_ <| cartridges ++ cartridges ++ cartridges


previousCartridge : List Cartridge -> String -> Maybe Cartridge
previousCartridge cartridges hash =
    let
        previous_ c =
            case c of
                h1 :: h2 :: tail ->
                    if h2.hash == hash then
                        Just h1

                    else
                        previous_ <| h2 :: tail

                _ ->
                    List.head <| List.reverse cartridges
    in
    previous_ <| cartridges ++ cartridges ++ cartridges



-- DECODER / ENCODER


decodeTvMode : Decoder TvMode
decodeTvMode =
    string
        |> Decode.andThen
            (\s ->
                case s of
                    "pal" ->
                        succeed PAL

                    "ntsc" ->
                        succeed NTSC

                    "secam" ->
                        succeed SECAM

                    _ ->
                        fail "invalid TvMode value"
            )


decodeCpuEmulation : Decoder CpuEmulation
decodeCpuEmulation =
    string
        |> Decode.andThen
            (\s ->
                case s of
                    "cycle" ->
                        succeed Cycle

                    "instruction" ->
                        succeed Instruction

                    _ ->
                        fail "invalid CpuEmulation value"
            )


decodeAudioEmulation : Decoder AudioEmulation
decodeAudioEmulation =
    string
        |> Decode.andThen
            (\s ->
                case s of
                    "pcm" ->
                        succeed PCM

                    "waveform" ->
                        succeed Waveform

                    _ ->
                        fail "invalid AudioEmulation value"
            )


decodeCartridge : Decoder Cartridge
decodeCartridge =
    succeed Cartridge
        |> required "hash" string
        |> required "name" string
        |> required "cartridgeType" string
        |> required "tvMode" decodeTvMode
        |> required "emulatePaddles" bool
        |> optional "rngSeed" (maybe int) Nothing
        |> optional "firstVisibleLine" (maybe int) Nothing
        |> optional "cpuEmulation" (maybe decodeCpuEmulation) Nothing
        |> optional "audioEmulation" (maybe decodeAudioEmulation) Nothing
        |> required "volume" int


decodeCartridgeType : Decoder CartridgeType
decodeCartridgeType =
    map2 CartridgeType
        (field "key" string)
        (field "description" string)
