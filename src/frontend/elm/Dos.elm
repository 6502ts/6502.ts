module Dos exposing (Color(..), backgroundColor, color, colorVariable, cw, marginRightCw, panel, panelLabel, select, widthCw)

import Css exposing (..)
import Html.Styled as Html exposing (..)
import Html.Styled.Attributes exposing (..)


type Color
    = Black
    | Blue
    | LightBlue
    | Green
    | LightGreen
    | Cyan
    | LightCyan
    | Red
    | LightRed
    | Magenta
    | LightMagenta
    | DarkGray
    | LightGray
    | Brown
    | Yellow
    | White


panel : Html.Attribute msg
panel =
    class "panel"


panelLabel : String -> Html.Attribute msg
panelLabel label =
    attribute "data-label" label


select : List (Attribute msg) -> List ( String, String ) -> Html msg
select attr values =
    let
        createOption ( v, t ) =
            option [ value v ] [ text t ]
    in
    span [ class "select-wrapper" ]
        [ Html.select attr <| List.map createOption values ]


cw : Float -> String
cw n =
    "calc(" ++ String.fromFloat n ++ " * var(--cw))"


widthCw : Float -> Css.Style
widthCw x =
    Css.property "width" <| cw x


marginRightCw : Float -> Css.Style
marginRightCw x =
    Css.property "margin-right" <| cw x


colorVariable : Color -> String
colorVariable color_ =
    let
        varName =
            case color_ of
                Black ->
                    "black"

                Blue ->
                    "blue"

                LightBlue ->
                    "light-blue"

                Green ->
                    "green"

                LightGreen ->
                    "light-green"

                Cyan ->
                    "cyan"

                LightCyan ->
                    "light-cyan"

                Magenta ->
                    "magenta"

                LightMagenta ->
                    "light-magenta"

                Red ->
                    "red"

                LightRed ->
                    "light-red"

                DarkGray ->
                    "dark-gray"

                LightGray ->
                    "light-gray"

                Brown ->
                    "brown"

                Yellow ->
                    "yellow"

                White ->
                    "white"
    in
    "var(--" ++ varName ++ ")"


backgroundColor : Color -> Style
backgroundColor color_ =
    Css.property "background-color" (colorVariable color_)


color : Color -> Style
color color_ =
    Css.property "color" (colorVariable color_)
