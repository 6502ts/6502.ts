module Stellerator.Model exposing
    ( AudioEmulation(..)
    , Cartridge
    , CartridgeType
    , ChangeCartridgeMsg(..)
    , CpuEmulation(..)
    , EmulationState(..)
    , Media(..)
    , Model
    , Msg(..)
    , Route(..)
    , TvMode(..)
    , decodeCartridge
    , decodeCartridgeType
    , update
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
    , media : Media
    , emulationState : EmulationState
    , helppage : Maybe String
    , sideMenu : Bool
    , cartridges : List Cartridge
    , currentCartridgeHash : Maybe String
    , cartridgeTypes : List CartridgeType
    , cartridgeFilter : String
    }



-- MESSAGE


type ChangeCartridgeMsg
    = ChangeCartridgeName String
    | ChangeCartridgeType String


type Msg
    = NavigateToUrl String
    | ChangeRoute Route
    | ChangeMedia Media
    | SetHelpPage String
    | ToggleSideMenu
    | ChangeCartridgeFilter String
    | ClearCartridgeFilter
    | SelectCurrentCartridge String
    | ClearCurrentCartridge
    | DeleteCurrentCartridge
    | ChangeCartridge String ChangeCartridgeMsg
    | None



-- UPDATE


updateCartridge : List CartridgeType -> ChangeCartridgeMsg -> Cartridge -> Cartridge
updateCartridge cartridgeTypes msg cartridge =
    case msg of
        ChangeCartridgeName name ->
            { cartridge | name = name }

        ChangeCartridgeType type_ ->
            let
                newType =
                    LE.find (\ct -> ct.key == type_) cartridgeTypes |> Maybe.map .key |> Maybe.withDefault cartridge.cartridgeType
            in
            { cartridge | cartridgeType = newType }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        noop x =
            ( x, Cmd.none )
    in
    case msg of
        NavigateToUrl url ->
            ( model, Nav.pushUrl model.key url )

        ChangeRoute route ->
            let
                emulationState =
                    case route of
                        Cartridges ->
                            Stopped

                        Settings ->
                            Paused

                        Emulation ->
                            Running (Just 3.55)

                        Help ->
                            Running Nothing
            in
            noop
                { model
                    | currentRoute = route
                    , emulationState = emulationState
                    , sideMenu = False
                }

        ChangeMedia media ->
            noop { model | media = media }

        ChangeCartridgeFilter cartridgeFilter ->
            noop { model | cartridgeFilter = cartridgeFilter }

        ClearCartridgeFilter ->
            noop { model | cartridgeFilter = "" }

        SelectCurrentCartridge hash ->
            noop { model | currentCartridgeHash = Just hash }

        ClearCurrentCartridge ->
            noop { model | currentCartridgeHash = Nothing }

        DeleteCurrentCartridge ->
            noop
                { model
                    | cartridges =
                        Maybe.map
                            (\h -> List.filter (\c -> c.hash /= h) model.cartridges)
                            model.currentCartridgeHash
                            |> Maybe.withDefault model.cartridges
                    , currentCartridgeHash = Nothing
                }

        ChangeCartridge hash msg_ ->
            noop
                { model
                    | cartridges =
                        List.map
                            (\c ->
                                if c.hash == hash then
                                    updateCartridge model.cartridgeTypes msg_ c

                                else
                                    c
                            )
                            model.cartridges
                }

        SetHelpPage content ->
            noop { model | helppage = Just content }

        ToggleSideMenu ->
            noop { model | sideMenu = not model.sideMenu }

        _ ->
            noop model



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
