module Stellerator.View.Settings exposing (page)

import Css exposing (..)
import Css.Global as Sel exposing (descendants)
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Stellerator.Model
    exposing
        ( AudioEmulation(..)
        , ChangeSettingsMsg(..)
        , CpuEmulation(..)
        , Media(..)
        , Model
        , Msg(..)
        , Settings
        )
import Stellerator.View.Form as Form


settingsList : Settings -> List (Html Msg)
settingsList settings =
    let
        oneline lbl control =
            label [ A.for "nothing", A.css [ display block ] ]
                [ span [ A.css [ display inlineBlock, property "width" "calc(20 * var(--cw))" ] ] [ text lbl ]
                , control
                ]
    in
    let
        checkbox lbl tagger value =
            label [ A.css [ cursor pointer, display block ] ]
                [ span [ A.css [ display inlineBlock, property "width" "calc(20 * var(--cw))" ] ] [ text lbl ]
                , Form.checkbox tagger value
                ]
    in
    [ h1 []
        [ text "General" ]
    , p
        []
        [ oneline "CPU emulation:" <|
            Form.radioGroup
                []
                [ ( AccuracyInstruction, "Instruction" ), ( AccuracyCycle, "Cycle" ) ]
                (ChangeSettings << ChangeSettingsCpuEmulation)
                settings.cpuEmulation
        ]
    , h1 [] [ text "Audio" ]
    , p []
        [ oneline "Audio emulation:" <|
            Form.radioGroup
                []
                [ ( AudioPCM, "PCM" ), ( AudioWaveform, "Waveform" ) ]
                (ChangeSettings << ChangeSettingsAudioEmulation)
                settings.audioEmulation
        , oneline
            "Volume:"
          <|
            Form.slider
                [ property "width" "calc(40*var(--cw))"
                , property "max-width" "calc(100vw - 4*var(--cw))"
                ]
                ( 0, 100 )
                (Maybe.map (ChangeSettings << ChangeSettingsVolume) >> Maybe.withDefault None)
                (\x -> String.fromInt x ++ "%")
                settings.volume
        ]
    , h1 [] [ text "Display" ]
    , p []
        [ checkbox "Smooth scaling:" (ChangeSettings << ChangeSettingsSmoothScaling) settings.smoothScaling
        , checkbox "Phosphor emulation:" (ChangeSettings << ChangeSettingsPhosphorEmulation) settings.phosphorEmulation
        , checkbox "Sync video:" (ChangeSettings << ChangeSettingsVideoSync) settings.videoSync
        , oneline "Gamma correction:" <|
            Form.slider
                [ property "width" "calc(40*var(--cw))"
                , property "max-width" "calc(100vw - 4*var(--cw))"
                ]
                ( 0, 50 )
                (Maybe.map (ChangeSettings << ChangeSettingsGammaCorrection << (\x -> x / 10) << toFloat) >> Maybe.withDefault None)
                (\x -> String.fromFloat <| toFloat x / 10)
                (Basics.round (settings.gammaCorrection * 10))
        ]
    , h1 [] [ text "Controls" ]
    , p []
        [ oneline "Touch controls:" <|
            Form.radioGroup
                []
                [ ( Nothing, "Auto" ), ( Just True, "On" ), ( Just False, "Off" ) ]
                (ChangeSettings << ChangeSettingsTouchControls)
                settings.touchControls
        , checkbox
            "Left handed mode:"
            (ChangeSettings << ChangeSettingsLeftHanded)
            settings.leftHanded
        , oneline "Touch joystick sensitivity:" <|
            Form.slider
                [ property "width" "calc(40*var(--cw))"
                , property "max-width" "calc(100vw - 4*var(--cw))"
                ]
                ( 0, 100 )
                (Maybe.map (ChangeSettings << ChangeSettingsVirtualJoystickSensitivity) >> Maybe.withDefault None)
                String.fromInt
                settings.virtualJoystickSensitivity
        ]
    , h1 [] [ text "Ui" ]
    , p []
        [ oneline "Display mode:" <|
            Form.radioGroup
                []
                [ ( Nothing, "Auto" ), ( Just MediaWide, "wide" ), ( Just MediaNarrow, "Narrow" ) ]
                (ChangeSettings << ChangeSettingsUiMode)
                settings.uiMode
        ]
    ]


page : Model -> List (Html Msg)
page model =
    [ div
        [ A.css
            [ property "padding" "1rem var(--cw) 1rem var(--cw)"
            , width (vw 100)
            , boxSizing borderBox
            , descendants [ Sel.label [ pseudoClass "not(:first-of-type)" [ paddingTop (Css.em 1) ] ] ]
            ]
        ]
        (settingsList model.settings)
    ]
