{-
   This file is part of 6502.ts, an emulator for 6502 based systems built
   in Typescript

   Copyright (c) 2014 -- 2020 Christian Speckner and contributors

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
-}


module Stellerator.Model exposing
    ( AudioEmulation(..)
    , Cartridge
    , CartridgeType
    , CartridgeViewMode(..)
    , ChangeCartridgeMsg(..)
    , ChangeSettingsMsg(..)
    , ColorSwitch(..)
    , ConsoleSwitches
    , ControllerType(..)
    , CpuEmulation(..)
    , DifficultySwitch(..)
    , EmulationState(..)
    , InputDriverEvent(..)
    , Media(..)
    , MessagePending
    , MessagePendingMetadata(..)
    , Model
    , Msg(..)
    , Route(..)
    , Scaling(..)
    , Settings
    , TvEmulation(..)
    , TvMode(..)
    , cartridgesMatchingSearch
    , decodeAudioEmulation
    , decodeCartridge
    , decodeCartridgeType
    , decodeControllerType
    , decodeCpuEmulation
    , decodeEmulationState
    , decodeInputDriverEvent
    , decodeMedia
    , decodeSettings
    , decodeTvMode
    , effectiveMedia
    , encodeAudioEmulation
    , encodeCartridge
    , encodeConsoleSwitches
    , encodeCpuEmulation
    , encodeMedia
    , encodeSettings
    , encodeTvMode
    , filterCartridgesBy
    , nextCartridge
    , previousCartridge
    , runningCartridge
    , selectionInSearchResults
    , touchEnabled
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
    | RouteAbout


type Media
    = MediaNarrow
    | MediaWide


type EmulationState
    = EmulationStopped
    | EmulationPaused
    | EmulationRunning (Maybe Float)
    | EmulationError String
    | EmulationStarting


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


type TvEmulation
    = TvEmulationComposite
    | TvEmulationSvideo
    | TvEmulationNone


type Scaling
    = ScalingQis
    | ScalingBilinear
    | ScalingNone


type ControllerType
    = ControllerTypeJoystick
    | ControllerTypePaddles
    | ControllerTypeKeypad


type alias Cartridge =
    { hash : String
    , name : String
    , cartridgeType : String
    , tvMode : TvMode
    , controllerPort0 : ControllerType
    , controllerPort1 : ControllerType
    , volume : Int
    , rngSeed : Maybe Int
    , firstVisibleLine : Maybe Int
    , cpuEmulation : Maybe CpuEmulation
    , audioEmulation : Maybe AudioEmulation
    , phosphorLevel : Maybe Int
    }


type alias Settings =
    { cpuEmulation : CpuEmulation
    , volume : Int
    , audioEmulation : AudioEmulation
    , gammaCorrection : Float
    , tvEmulation : TvEmulation
    , scaling : Scaling
    , phosphorLevel : Int
    , scanlineIntensity : Int
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


type DifficultySwitch
    = DifficultyPro
    | DifficultyAmateur


type ColorSwitch
    = ColorColor
    | ColorBW


type alias ConsoleSwitches =
    { difficultyP0 : DifficultySwitch
    , difficultyP1 : DifficultySwitch
    , color : ColorSwitch
    }


type MessagePendingMetadata
    = MessagePendingConfirmOrReject String ( String, String )
    | MessagePendingAck String String


type alias MessagePending =
    ( Maybe Msg, MessagePendingMetadata )


type alias Model =
    { key : Nav.Key
    , currentRoute : Route
    , media : Maybe Media
    , touchSupport : Bool
    , emulationState : EmulationState
    , helppage : Maybe String
    , changelog : Maybe String
    , license : Maybe String
    , sideMenu : Bool
    , cartridges : List Cartridge
    , currentCartridgeHash : Maybe String
    , runningCartridgeHash : Maybe String
    , cartridgeTypes : List CartridgeType
    , cartridgeFilter : String
    , cartridgeViewMode : CartridgeViewMode
    , settings : Settings
    , defaultSettings : Settings
    , messagePending : MessagePending
    , emulationPaused : Bool
    , showMessageOnPause : Bool
    , limitFramerate : Bool
    , consoleSwitches : ConsoleSwitches
    , version : String
    , gamepadCount : Int
    , badGpu : Bool
    }


validUiSizes : List Int
validUiSizes =
    [ 50, 75, 100, 125, 150 ]



-- MESSAGE


type ChangeCartridgeMsg
    = ChangeCartridgeName String
    | ChangeCartridgeType String
    | ChangeCartridgeTvMode TvMode
    | ChangeCartridgeControllerPort0 ControllerType
    | ChangeCartridgeControllerPort1 ControllerType
    | ChangeCartridgeRngSeed (Maybe Int)
    | ChangeCartridgeFirstVisibleLine (Maybe Int)
    | ChangeCartridgeCpuEmulation (Maybe CpuEmulation)
    | ChangeCartridgeAudioEmulation (Maybe AudioEmulation)
    | ChangeCartridgeVolume Int
    | ChangeCartridgePhosphorLevel (Maybe Int)


type ChangeSettingsMsg
    = ChangeSettingsCpuEmulation CpuEmulation
    | ChangeSettingsVolume Int
    | ChangeSettingsAudioEmulation AudioEmulation
    | ChangeSettingsGammaCorrection Float
    | ChangeSettingsTvEmulation TvEmulation
    | ChangeSettingsScaling Scaling
    | ChangeSettingsPhosphorLevel Int
    | ChangeSettingsScanlineIntensity Int
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
    | SetChangelog String
    | SetLicense String
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
    | SaveCartridge String
    | ChangeSettings ChangeSettingsMsg
    | MessageNeedsConfirmOrReject String ( String, String ) Msg
    | MessageNeedsAck String String Msg
    | RejectPendingMessage
    | ConfirmPendingMessage
    | StartEmulation String
    | PauseEmulation
    | StopEmulation
    | ResetEmulation
    | TogglePauseEmulation
    | ChangeLimitFramerate Bool
    | UpdateEmulationState EmulationState
    | IncomingInputDriverEvent InputDriverEvent
    | ChangeDifficultyP0 DifficultySwitch
    | ChangeDifficultyP1 DifficultySwitch
    | ChangeColorSwitch ColorSwitch
    | BlurCurrentElement
    | NavigateToAboutPage
    | UpdateGamepadCount Int
    | None



-- HELPERS AND SELECTORS


filterCartridgesBy : String -> List Cartridge -> List Cartridge
filterCartridgesBy filter cartridges =
    let
        filterWords =
            filter |> String.toUpper |> String.words
    in
    List.filter
        (\c -> List.all (\w -> String.contains w <| String.toUpper c.name) filterWords)
        cartridges


cartridgesMatchingSearch : Model -> List Cartridge
cartridgesMatchingSearch model =
    filterCartridgesBy model.cartridgeFilter model.cartridges


selectionInSearchResults : Model -> Maybe String
selectionInSearchResults model =
    model.currentCartridgeHash
        |> Maybe.andThen
            (\h -> LE.find (\c -> c.hash == h) <| cartridgesMatchingSearch model)
        >> Maybe.map (\c -> c.hash)


nextCartridge : List Cartridge -> String -> Maybe Cartridge
nextCartridge cartridges hash =
    let
        cartridgesSorted =
            List.sortBy (.name >> String.toUpper) cartridges

        next_ c =
            case c of
                h1 :: h2 :: tail ->
                    if h1.hash == hash then
                        Just h2

                    else
                        next_ <| h2 :: tail

                _ ->
                    List.head cartridgesSorted
    in
    next_ <| cartridgesSorted ++ cartridgesSorted ++ cartridgesSorted


previousCartridge : List Cartridge -> String -> Maybe Cartridge
previousCartridge cartridges hash =
    let
        cartridgesSorted =
            List.sortBy (.name >> String.toUpper) cartridges

        previous_ c =
            case c of
                h1 :: h2 :: tail ->
                    if h2.hash == hash then
                        Just h1

                    else
                        previous_ <| h2 :: tail

                _ ->
                    List.head <| List.reverse cartridgesSorted
    in
    previous_ <| cartridgesSorted ++ cartridgesSorted ++ cartridgesSorted


effectiveMedia : Model -> Maybe Media
effectiveMedia model =
    case model.settings.uiMode of
        Just m ->
            Just m

        Nothing ->
            model.media


runningCartridge : Model -> Maybe Cartridge
runningCartridge model =
    model.runningCartridgeHash |> Maybe.andThen (\h -> LE.find (.hash >> (==) h) model.cartridges)


touchEnabled : Model -> Bool
touchEnabled model =
    Maybe.withDefault model.touchSupport model.settings.touchControls



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


decodeTvEmulation : Decode.Decoder TvEmulation
decodeTvEmulation =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "composite" ->
                        Decode.succeed TvEmulationComposite

                    "svideo" ->
                        Decode.succeed TvEmulationSvideo

                    "none" ->
                        Decode.succeed TvEmulationNone

                    _ ->
                        Decode.fail "invalid tv emulation value"
            )


encodeTvEmulation : TvEmulation -> Encode.Value
encodeTvEmulation tvEmulation =
    case tvEmulation of
        TvEmulationComposite ->
            Encode.string "composite"

        TvEmulationSvideo ->
            Encode.string "svideo"

        TvEmulationNone ->
            Encode.string "none"


decodeScaling : Decode.Decoder Scaling
decodeScaling =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "qis" ->
                        Decode.succeed ScalingQis

                    "bilinear" ->
                        Decode.succeed ScalingBilinear

                    "none" ->
                        Decode.succeed ScalingNone

                    _ ->
                        Decode.fail "invalid scaling value"
            )


encodeScaling : Scaling -> Encode.Value
encodeScaling scaling =
    case scaling of
        ScalingQis ->
            Encode.string "qis"

        ScalingBilinear ->
            Encode.string "bilinear"

        ScalingNone ->
            Encode.string "none"

decodeControllerType : Decode.Decoder ControllerType
decodeControllerType =
    Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "joystick" ->
                        Decode.succeed ControllerTypeJoystick

                    "paddles" ->
                        Decode.succeed ControllerTypePaddles

                    "keypad" ->
                        Decode.succeed ControllerTypeKeypad

                    _ ->
                        Decode.fail "invalid controller value"
            )

encodeControllerType : ControllerType -> Encode.Value
encodeControllerType scaling =
    case scaling of
        ControllerTypeJoystick ->
            Encode.string "joystick"

        ControllerTypePaddles ->
            Encode.string "paddles"

        ControllerTypeKeypad ->
            Encode.string "keypad"

decodeSettings : Decode.Decoder Settings
decodeSettings =
    Decode.succeed Settings
        |> Pipeline.required "cpuEmulation" decodeCpuEmulation
        |> Pipeline.required "volume" Decode.int
        |> Pipeline.required "audioEmulation" decodeAudioEmulation
        |> Pipeline.required "gammaCorrection" Decode.float
        |> Pipeline.required "tvEmulation" decodeTvEmulation
        |> Pipeline.required "scaling" decodeScaling
        |> Pipeline.required "phosphorLevel" Decode.int
        |> Pipeline.required "scanlineIntensity" Decode.int
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
    , ( "gammaCorrection", Encode.float settings.gammaCorrection )
    , ( "tvEmulation", encodeTvEmulation settings.tvEmulation )
    , ( "scaling", encodeScaling settings.scaling )
    , ( "phosphorLevel", Encode.int settings.phosphorLevel )
    , ( "scanlineIntensity", Encode.int settings.scanlineIntensity )
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
        |> Pipeline.required "controllerPort0" decodeControllerType
        |> Pipeline.required "controllerPort1" decodeControllerType
        |> Pipeline.required "volume" Decode.int
        |> Pipeline.optional "rngSeed" (Decode.maybe Decode.int) Nothing
        |> Pipeline.optional "firstVisibleLine" (Decode.maybe Decode.int) Nothing
        |> Pipeline.optional "cpuEmulation" (Decode.maybe decodeCpuEmulation) Nothing
        |> Pipeline.optional "audioEmulation" (Decode.maybe decodeAudioEmulation) Nothing
        |> Pipeline.optional "phosphorLevel" (Decode.maybe Decode.int) Nothing


encodeCartridge : Cartridge -> Encode.Value
encodeCartridge cartridge =
    [ ( "hash", Encode.string cartridge.hash )
    , ( "name", Encode.string cartridge.name )
    , ( "cartridgeType", Encode.string cartridge.cartridgeType )
    , ( "tvMode", encodeTvMode cartridge.tvMode )
    , ( "controllerPort0", encodeControllerType cartridge.controllerPort0 )
    , ( "controllerPort1", encodeControllerType cartridge.controllerPort1 )
    , ( "volume", Encode.int cartridge.volume )
    ]
        |> encodeOptional "rngSeed" Encode.int cartridge.rngSeed
        |> encodeOptional "firstVisibleLine" Encode.int cartridge.firstVisibleLine
        |> encodeOptional "cpuEmulation" encodeCpuEmulation cartridge.cpuEmulation
        |> encodeOptional "audioEmulation" encodeAudioEmulation cartridge.audioEmulation
        |> encodeOptional "phosphorLevel" Encode.int cartridge.phosphorLevel
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


encodeDifficultySwitch : DifficultySwitch -> Encode.Value
encodeDifficultySwitch difficultySwitch =
    case difficultySwitch of
        DifficultyPro ->
            Encode.string "pro"

        DifficultyAmateur ->
            Encode.string "amateur"


encodeColorSwitch : ColorSwitch -> Encode.Value
encodeColorSwitch colorSwitch =
    case colorSwitch of
        ColorColor ->
            Encode.string "color"

        ColorBW ->
            Encode.string "bw"


encodeConsoleSwitches : ConsoleSwitches -> Encode.Value
encodeConsoleSwitches consoleSwitches =
    Encode.object
        [ ( "difficultyP0", encodeDifficultySwitch consoleSwitches.difficultyP0 )
        , ( "difficultyP1", encodeDifficultySwitch consoleSwitches.difficultyP1 )
        , ( "color", encodeColorSwitch consoleSwitches.color )
        ]
