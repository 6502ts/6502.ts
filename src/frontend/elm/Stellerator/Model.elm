module Stellerator.Model exposing
    ( AudioEmulation(..)
    , Cartridge
    , CartridgeType
    , CartridgeViewMode(..)
    , ChangeCartridgeMsg(..)
    , ChangeSettingsMsg(..)
    , CpuEmulation(..)
    , EmulationState(..)
    , InputDriverEvent(..)
    , Media(..)
    , Model
    , Msg(..)
    , Route(..)
    , Settings
    , TvMode(..)
    , cartridgesMatchingSearch
    , decodeAudioEmulation
    , decodeCartridge
    , decodeCartridgeType
    , decodeCpuEmulation
    , decodeEmulationState
    , decodeInputDriverEvent
    , decodeMedia
    , decodeSettings
    , decodeTvMode
    , effectiveMedia
    , encodeAudioEmulation
    , encodeCartridge
    , encodeCpuEmulation
    , encodeMedia
    , encodeSettings
    , encodeTvMode
    , nextCartridge
    , previousCartridge
    , selectionInSearchResults
    , validUiSizes
    )

import Browser.Navigation as Nav
import Json.Decode as Decode
import Json.Decode.Pipeline as Pipeline
import Json.Encode as Encode
import List.Extra as LE



-- MODEL DEFINITION


type Route
    = RouteCartridges
    | RouteSettings
    | RouteEmulation
    | RouteHelp


type Media
    = MediaNarrow
    | MediaWide


type EmulationState
    = EmulationStopped
    | EmulationPaused
    | EmulationRunning (Maybe Float)
    | EmulationError String


type TvMode
    = TvPAL
    | TvNTSC
    | TvSECAM


type CpuEmulation
    = AccuracyCycle
    | AccuracyInstruction


type AudioEmulation
    = AudioWaveform
    | AudioPCM


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


type alias Settings =
    { cpuEmulation : CpuEmulation
    , volume : Int
    , audioEmulation : AudioEmulation
    , smoothScaling : Bool
    , phosphorEmulation : Bool
    , gammaCorrection : Float
    , videoSync : Bool
    , touchControls : Maybe Bool
    , leftHanded : Bool
    , virtualJoystickSensitivity : Int
    , uiMode : Maybe Media
    , uiSize : Int
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
    , settings : Settings
    , defaultSettings : Settings
    , messageNeedsConfirmation : ( String, Maybe Msg )
    , emulationPaused : Bool
    }


validUiSizes : List Int
validUiSizes =
    [ 50, 75, 100, 125, 150 ]



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


type ChangeSettingsMsg
    = ChangeSettingsCpuEmulation CpuEmulation
    | ChangeSettingsVolume Int
    | ChangeSettingsAudioEmulation AudioEmulation
    | ChangeSettingsSmoothScaling Bool
    | ChangeSettingsPhosphorEmulation Bool
    | ChangeSettingsGammaCorrection Float
    | ChangeSettingsVideoSync Bool
    | ChangeSettingsTouchControls (Maybe Bool)
    | ChangeSettingsLeftHanded Bool
    | ChangeSettingsVirtualJoystickSensitivity Int
    | ChangeSettingsUiMode (Maybe Media)
    | ChangeSettingsUiSize Int
    | ChangeSettingsResetToDefault


type InputDriverEvent
    = EventTogglePause
    | EventReset
    | EventToggleFullscreen


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
    | DeleteAllCartridges
    | ChangeCartridge String ChangeCartridgeMsg
    | ChangeCartridgeViewMode CartridgeViewMode
    | AddCartridge
    | AddNewCartridges (List Cartridge)
    | ChangeSettings ChangeSettingsMsg
    | MessageNeedsConfirmation String Msg
    | RejectPendingMessage
    | ConfirmPendingMessage
    | StartEmulation String
    | PauseEmulaton
    | StopEmulation
    | UpdateEmulationState EmulationState
    | IncomingInputDriverEvent InputDriverEvent
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


effectiveMedia : Model -> Maybe Media
effectiveMedia model =
    case model.settings.uiMode of
        Just m ->
            Just m

        Nothing ->
            model.media



-- DECODER / ENCODER


encodeOptional : String -> (a -> Decode.Value) -> Maybe a -> List ( String, Encode.Value ) -> List ( String, Encode.Value )
encodeOptional name encoder maybeValue list =
    Maybe.map (\v -> ( name, encoder v ) :: list) maybeValue |> Maybe.withDefault list


decodeTvMode : Decode.Decoder TvMode
decodeTvMode =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "pal" ->
                        Decode.succeed TvPAL

                    "ntsc" ->
                        Decode.succeed TvNTSC

                    "secam" ->
                        Decode.succeed TvSECAM

                    _ ->
                        Decode.fail "invalid TvMode value"
            )


encodeTvMode : TvMode -> Encode.Value
encodeTvMode tvMode =
    case tvMode of
        TvPAL ->
            Encode.string "pal"

        TvNTSC ->
            Encode.string "ntsc"

        TvSECAM ->
            Encode.string "secam"


decodeCpuEmulation : Decode.Decoder CpuEmulation
decodeCpuEmulation =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "cycle" ->
                        Decode.succeed AccuracyCycle

                    "instruction" ->
                        Decode.succeed AccuracyInstruction

                    _ ->
                        Decode.fail "invalid CpuEmulation value"
            )


encodeCpuEmulation : CpuEmulation -> Encode.Value
encodeCpuEmulation cpuEmulation =
    case cpuEmulation of
        AccuracyCycle ->
            Encode.string "cycle"

        AccuracyInstruction ->
            Encode.string "instruction"


decodeAudioEmulation : Decode.Decoder AudioEmulation
decodeAudioEmulation =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "pcm" ->
                        Decode.succeed AudioPCM

                    "waveform" ->
                        Decode.succeed AudioWaveform

                    _ ->
                        Decode.fail "invalid AudioEmulation value"
            )


encodeAudioEmulation : AudioEmulation -> Encode.Value
encodeAudioEmulation audioEmulation =
    case audioEmulation of
        AudioPCM ->
            Encode.string "pcm"

        AudioWaveform ->
            Encode.string "waveform"


decodeMedia : Decode.Decoder Media
decodeMedia =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "wide" ->
                        Decode.succeed MediaWide

                    "narrow" ->
                        Decode.succeed MediaNarrow

                    _ ->
                        Decode.fail "invalid media value"
            )


encodeMedia : Media -> Encode.Value
encodeMedia media =
    case media of
        MediaWide ->
            Encode.string "wide"

        MediaNarrow ->
            Encode.string "narrow"


decodeSettings : Decode.Decoder Settings
decodeSettings =
    Decode.succeed Settings
        |> Pipeline.required "cpuEmulation" decodeCpuEmulation
        |> Pipeline.required "volume" Decode.int
        |> Pipeline.required "audioEmulation" decodeAudioEmulation
        |> Pipeline.required "smoothScaling" Decode.bool
        |> Pipeline.required "phosphorEmulation" Decode.bool
        |> Pipeline.required "gammaCorrection" Decode.float
        |> Pipeline.required "videoSync" Decode.bool
        |> Pipeline.optional "touchControls" (Decode.maybe Decode.bool) Nothing
        |> Pipeline.required "leftHanded" Decode.bool
        |> Pipeline.required "virtualJoystickSensitivity" Decode.int
        |> Pipeline.optional "uiMode" (Decode.maybe decodeMedia) Nothing
        |> Pipeline.required "uiSize" Decode.int


encodeSettings : Settings -> Encode.Value
encodeSettings settings =
    [ ( "cpuEmulation", encodeCpuEmulation settings.cpuEmulation )
    , ( "volume", Encode.int settings.volume )
    , ( "audioEmulation", encodeAudioEmulation settings.audioEmulation )
    , ( "smoothScaling", Encode.bool settings.smoothScaling )
    , ( "phosphorEmulation", Encode.bool settings.phosphorEmulation )
    , ( "gammaCorrection", Encode.float settings.gammaCorrection )
    , ( "videoSync", Encode.bool settings.videoSync )
    , ( "leftHanded", Encode.bool settings.leftHanded )
    , ( "virtualJoystickSensitivity", Encode.int settings.virtualJoystickSensitivity )
    , ( "uiSize", Encode.int settings.uiSize )
    ]
        |> encodeOptional "touchControls" Encode.bool settings.touchControls
        |> encodeOptional "uiMode" encodeMedia settings.uiMode
        |> Encode.object


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
    [ ( "hash", Encode.string cartridge.hash )
    , ( "name", Encode.string cartridge.name )
    , ( "cartridgeType", Encode.string cartridge.cartridgeType )
    , ( "tvMode", encodeTvMode cartridge.tvMode )
    , ( "emulatePaddles", Encode.bool cartridge.emulatePaddles )
    , ( "volume", Encode.int cartridge.volume )
    ]
        |> encodeOptional "rngSeed" Encode.int cartridge.rngSeed
        |> encodeOptional "firstVisibleLine" Encode.int cartridge.firstVisibleLine
        |> encodeOptional "cpuEmulation" encodeCpuEmulation cartridge.cpuEmulation
        |> encodeOptional "audioEmulation" encodeAudioEmulation cartridge.audioEmulation
        |> encodeOptional "phosphorEmulation" Encode.bool cartridge.phosphorEmulation
        |> Encode.object


decodeCartridgeType : Decode.Decoder CartridgeType
decodeCartridgeType =
    Decode.map2 CartridgeType
        (Decode.field "key" Decode.string)
        (Decode.field "description" Decode.string)


decodeEmulationState : Decode.Decoder EmulationState
decodeEmulationState =
    Decode.field "state" Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "stopped" ->
                        Decode.succeed EmulationStopped

                    "paused" ->
                        Decode.succeed EmulationPaused

                    "running" ->
                        Decode.field "frequency" Decode.float |> Decode.maybe |> Decode.map EmulationRunning

                    "error" ->
                        Decode.field "error" Decode.string |> Decode.map EmulationError

                    _ ->
                        Decode.fail "invalid emulation state"
            )


decodeInputDriverEvent : Decode.Decoder InputDriverEvent
decodeInputDriverEvent =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "pause" ->
                        Decode.succeed EventTogglePause

                    "reset" ->
                        Decode.succeed EventReset

                    "fullscreen" ->
                        Decode.succeed EventToggleFullscreen

                    _ ->
                        Decode.fail "invalid input driver event"
            )
