module Stellerator.View.Settings exposing (page)

import Css exposing (..)
import Css.Global as Sel exposing (descendants)
import Dos
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
        , validUiSizes
        )
import Stellerator.View.Form as Form


settingsList : Settings -> Media -> Bool -> List (Html Msg)
settingsList settings media haveCartridges =
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
    let
        section t =
            h1 [ A.css [ Dos.color Dos.Cyan ] ] [ text t ]
    in
    [ section "General"
    , p
        []
        [ oneline "CPU emulation:" <|
            Form.radioGroup
                []
                [ ( AccuracyInstruction, "Instruction" ), ( AccuracyCycle, "Cycle" ) ]
                (ChangeSettings << ChangeSettingsCpuEmulation)
                settings.cpuEmulation
        ]
    , section "Audio"
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
    , section "Display"
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
    , section "Controls"
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
    , section "Ui"
    , p []
        [ oneline "Display mode:" <|
            Form.radioGroup
                []
                [ ( Nothing, "Auto" ), ( Just MediaWide, "Wide" ), ( Just MediaNarrow, "Narrow" ) ]
                (ChangeSettings << ChangeSettingsUiMode)
                settings.uiMode
        , oneline "Size:" <|
            Form.picker
                (List.map ((\s -> ( s, s ++ "%" )) << String.fromInt) validUiSizes)
                (String.toInt >> Maybe.map (ChangeSettings << ChangeSettingsUiSize) >> Maybe.withDefault None)
                (String.fromInt settings.uiSize)
        ]
    , section "Reset"
    , p [] <|
        let
            buttonWidth =
                property "width" "calc(25*var(--cw))"
        in
        [ Form.responsiveButton media [ A.css [ buttonWidth ] ] (ChangeSettings ChangeSettingsResetToDefault) "Reset to defaults"
        , Form.responsiveButton media
            [ A.css [ buttonWidth ], A.disabled <| not haveCartridges ]
            (MessageNeedsConfirmation "Do you really want to delete all cartridges?" DeleteAllCartridges)
            "Delete all cartridges"
        ]
    ]


page : Model -> Media -> List (Html Msg)
page model media =
    [ div
        [ A.css
            [ property "padding" "1rem var(--cw) 1rem var(--cw)"
            , width (vw 100)
            , boxSizing borderBox
            , descendants [ Sel.label [ pseudoClass "not(:first-of-type)" [ paddingTop (Css.em 1) ] ] ]
            ]
        ]
        (settingsList model.settings media (List.length model.cartridges > 0))
    ]
