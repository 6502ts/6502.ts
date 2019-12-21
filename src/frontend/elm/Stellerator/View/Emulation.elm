module Stellerator.View.Emulation exposing (page)

import Css exposing (..)
import Css.Media as Media
import Dos
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Html.Styled.Events as E
import Stellerator.Model exposing (ColorSwitch(..), DifficultySwitch(..), EmulationState(..), Model, Msg(..))
import Stellerator.View.Form as Form


controlHelp : List (Html msg)
controlHelp =
    let
        item x =
            li [] [ text x ]
    in
    [ p [ A.css [ margin (px 0) ] ]
        [ text "Keyboard controls: "
        , ul []
            [ item "LEFT JOYSTICK: wasd / arrows + v / space"
            , item "RIGHT JOYSTICK: ijkl + b"
            , item "RESET: shift-enter"
            , item "SELECT: shifht-space"
            , item "TOGGLE FULLSCREEN: enter"
            , item "HARD RESET: shift-r"
            , item "PAUSE: p"
            ]
        ]
    ]


console : Model -> List (Html Msg)
console model =
    let
        emulationActive =
            case model.emulationState of
                EmulationPaused ->
                    True

                EmulationRunning _ ->
                    True

                _ ->
                    False
    in
    let
        oneline lbl control =
            label [ A.for "nothing", A.css [ display block ] ]
                [ span [ A.css [ display inlineBlock, property "width" "calc(20 * var(--cw))" ] ] [ text lbl ]
                , control
                ]
    in
    let
        checkbox lbl control =
            label [ A.css [ cursor pointer ] ]
                [ span [ A.css [ display inlineBlock, property "width" "calc(20 * var(--cw))" ] ] [ text lbl ]
                , control
                ]
    in
    [ oneline "Difficulty left:" <|
        Form.radioGroup
            []
            [ ( DifficultyPro, "A/Pro:" ), ( DifficultyAmateur, "B/Amateur:" ) ]
            ChangeDifficultyP0
            model.consoleSwitches.difficultyP0
    , oneline "Difficulty right:" <|
        Form.radioGroup
            []
            [ ( DifficultyPro, "A/Pro:" ), ( DifficultyAmateur, "B/Amateur:" ) ]
            ChangeDifficultyP1
            model.consoleSwitches.difficultyP1
    , oneline "TV mode:" <|
        Form.radioGroup
            []
            [ ( ColorColor, "Color:" ), ( ColorBW, "BW:" ) ]
            ChangeColorSwitch
            model.consoleSwitches.color
    , checkbox "Limit framerate:" <| Form.checkbox ChangeLimitFramerate model.limitFramerate
    , br [] []
    , br [] []
    , button
        [ E.onClick TogglePauseEmulation
        , A.disabled <| not emulationActive
        , A.css [ property "min-width" "calc(15 * var(--cw))" ]
        ]
        [ text <|
            if model.emulationPaused then
                "Resume"

            else
                "Pause"
        ]
    , button
        [ E.onClick ResetEmulation
        , A.disabled <| not emulationActive
        , A.css [ property "min-width" "calc(15 * var(--cw))" ]
        ]
        [ text "Hard Reset" ]
    ]


page : Model -> List (Html Msg)
page model =
    let
        small =
            Media.withMedia [ Media.all [ Media.maxWidth (px 900) ] ]
    in
    [ div
        [ A.css
            [ width (vw 100)
            , property "height" "calc(100vh - 3em)"
            , marginTop (Css.em 1)
            , displayFlex
            , boxSizing borderBox
            , alignItems stretch
            , flexDirection row
            , small [ display block ]
            ]
        ]
        [ div
            [ Dos.panel
            , A.css
                [ displayFlex
                , alignItems stretch
                , flexGrow (int 1)
                , small [ property "height" "calc(75vh - 4em)", maxHeight (px 600) ]
                ]
            ]
            [ div
                [ A.css
                    [ flexGrow (int 1)
                    , property "padding" "1em calc(2 * var(--cw))"
                    , Dos.backgroundColor Dos.Black
                    ]
                ]
                [ canvas [ A.id "stellerator-canvas", A.css [ width (pct 100), height (pct 100) ] ] []
                ]
            ]
        , div
            [ A.css
                [ flexGrow (num 0)
                , flexShrink (int 0)
                , property "flex-basis" "calc(50 * var(--cw))"
                , displayFlex
                , flexDirection column
                , alignItems stretch
                ]
            ]
            [ div [ Dos.panel, Dos.panelLabel "Console:" ] <| console model
            , div [ Dos.panel, Dos.panelLabel "Help:", A.css [ flexGrow (int 1), overflow hidden ] ]
                [ div
                    [ A.css
                        [ width <| pct 100
                        , height <| pct 100
                        , overflowY scroll
                        , property "-webkit-overflow-scrolling" "touch"
                        ]
                    ]
                    controlHelp
                ]
            ]
        ]
    ]
