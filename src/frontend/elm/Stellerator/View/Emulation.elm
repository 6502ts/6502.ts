module Stellerator.View.Emulation exposing (page)

import Css exposing (..)
import Dos
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Stellerator.Model exposing (Model, Msg(..))
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
console _ =
    let
        oneline lbl control =
            label [ A.for "nothing" ]
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
            [ ( 1, "A / Pro:" ), ( 2, "B / Amateur:" ) ]
            (\_ -> None)
            1
    , oneline "Difficulty right:" <|
        Form.radioGroup
            []
            [ ( 1, "A / Pro:" ), ( 2, "B / Amateur:" ) ]
            (\_ -> None)
            1
    , oneline "TV mode:" <|
        Form.radioGroup
            []
            [ ( 1, "Color:" ), ( 2, "BW:" ) ]
            (\_ -> None)
            1
    , checkbox "Limit framerate:" <| Form.checkbox (\_ -> None) True
    , br [] []
    , br [] []
    , button [] [ text "Pause" ]
    , button [] [ text "Hard Reset" ]
    ]


page : Model -> List (Html Msg)
page model =
    [ div
        [ A.css
            [ width (vw 100)
            , property "height" "calc(100vh - 3em)"
            , marginTop (Css.em 1)
            , displayFlex
            , boxSizing borderBox
            , alignItems stretch
            ]
        ]
        [ div
            [ Dos.panel
            , A.css
                [ displayFlex
                , alignItems stretch
                , flexGrow (int 1)
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
                , property "flex-basis" "calc(60 * var(--cw))"
                , displayFlex
                , flexDirection column
                , alignItems stretch
                ]
            ]
            [ div [ Dos.panel, Dos.panelLabel "Cosole:" ] <| console model
            , div [ Dos.panel, Dos.panelLabel "Help:", A.css [ flexGrow (int 1) ] ]
                controlHelp
            ]
        ]
    ]
