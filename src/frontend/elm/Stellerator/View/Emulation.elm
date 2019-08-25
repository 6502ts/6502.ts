module Stellerator.View.Emulation exposing (page)

import Css exposing (..)
import Dos
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Stellerator.Model exposing (Model, Msg)
import Stellerator.View.Form


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
            , item "RIGHT JOYSTICK joystick: ijkl + b"
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
    []


page : Model -> List (Html Msg)
page _ =
    [ div
        [ A.css
            [ width (vw 100)
            , property "height" "calc(100vh - 2em)"
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
            [ div [ Dos.panel, Dos.panelLabel "Console:" ] [ text "Console controls" ]
            , div [ Dos.panel, A.css [ flexGrow (int 1) ] ]
                controlHelp
            ]
        ]
    ]
