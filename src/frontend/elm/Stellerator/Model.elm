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
    , decodeAudioEmulation
    , decodeCartridge
    , decodeCartridgeType
    , decodeCpuEmulation
    , decodeTvMode
    , encodeAudioEmulation
    , encodeCartridge
    , encodeCpuEmulation
    , encodeTvMode
    , nextCartridge
    , previousCartridge
    , selectionInSearchResults
    )

import Browser.Navigation as Nav
import Json.Decode as Decode
import Json.Decode.Pipeline as Pipeline
import Json.Encode as Encode
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
    , volume : Int
    , rngSeed : Maybe Int
    , firstVisibleLine : Maybe Int
    , cpuEmulation : Maybe CpuEmulation
    , audioEmulation : Maybe AudioEmulation
    , phosphorEmulation : Maybe Bool
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
    | ChangeCartridgePhosphorEmulation (Maybe Bool)
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
    | AddNewCartridges (List Cartridge)
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


decodeTvMode : Decode.Decoder TvMode
decodeTvMode =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "pal" ->
                        Decode.succeed PAL

                    "ntsc" ->
                        Decode.succeed NTSC

                    "secam" ->
                        Decode.succeed SECAM

                    _ ->
                        Decode.fail "invalid TvMode value"
            )


encodeTvMode : TvMode -> Encode.Value
encodeTvMode tvMode =
    case tvMode of
        PAL ->
            Encode.string "pal"

        NTSC ->
            Encode.string "ntsc"

        SECAM ->
            Encode.string "secam"


decodeCpuEmulation : Decode.Decoder CpuEmulation
decodeCpuEmulation =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "cycle" ->
                        Decode.succeed Cycle

                    "instruction" ->
                        Decode.succeed Instruction

                    _ ->
                        Decode.fail "invalid CpuEmulation value"
            )


encodeCpuEmulation : CpuEmulation -> Encode.Value
encodeCpuEmulation cpuEmulation =
    case cpuEmulation of
        Cycle ->
            Encode.string "cycle"

        Instruction ->
            Encode.string "instruction"


decodeAudioEmulation : Decode.Decoder AudioEmulation
decodeAudioEmulation =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "pcm" ->
                        Decode.succeed PCM

                    "waveform" ->
                        Decode.succeed Waveform

                    _ ->
                        Decode.fail "invalid AudioEmulation value"
            )


encodeAudioEmulation : AudioEmulation -> Encode.Value
encodeAudioEmulation audioEmulation =
    case audioEmulation of
        PCM ->
            Encode.string "pcm"

        Waveform ->
            Encode.string "waveform"


decodeCartridge : Decode.Decoder Cartridge
decodeCartridge =
    Decode.succeed Cartridge
        |> Pipeline.required "hash" Decode.string
        |> Pipeline.required "name" Decode.string
        |> Pipeline.required "cartridgeType" Decode.string
        |> Pipeline.required "tvMode" decodeTvMode
        |> Pipeline.required "emulatePaddles" Decode.bool
        |> Pipeline.required "volume" Decode.int
        |> Pipeline.optional "rngSeed" (Decode.maybe Decode.int) Nothing
        |> Pipeline.optional "firstVisibleLine" (Decode.maybe Decode.int) Nothing
        |> Pipeline.optional "cpuEmulation" (Decode.maybe decodeCpuEmulation) Nothing
        |> Pipeline.optional "audioEmulation" (Decode.maybe decodeAudioEmulation) Nothing
        |> Pipeline.optional "phosphorEmulation" (Decode.maybe Decode.bool) Nothing


encodeCartridge : Cartridge -> Encode.Value
encodeCartridge cartridge =
    let
        optional name encoder maybeValue list =
            Maybe.map (\v -> ( name, encoder v ) :: list) maybeValue |> Maybe.withDefault list
    in
    [ ( "hash", Encode.string cartridge.hash )
    , ( "name", Encode.string cartridge.name )
    , ( "cartridgeType", Encode.string cartridge.cartridgeType )
    , ( "tvMode", encodeTvMode cartridge.tvMode )
    , ( "emulatePaddles", Encode.bool cartridge.emulatePaddles )
    , ( "volume", Encode.int cartridge.volume )
    ]
        |> optional "rngSeed" Encode.int cartridge.rngSeed
        |> optional "firstVisibleLine" Encode.int cartridge.firstVisibleLine
        |> optional "cpuEmulation" encodeCpuEmulation cartridge.cpuEmulation
        |> optional "audioEmulation" encodeAudioEmulation cartridge.audioEmulation
        |> optional "phosphorEmulation" Encode.bool cartridge.phosphorEmulation
        |> Encode.object


decodeCartridgeType : Decode.Decoder CartridgeType
decodeCartridgeType =
    Decode.map2 CartridgeType
        (Decode.field "key" Decode.string)
        (Decode.field "description" Decode.string)
