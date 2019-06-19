module Dos exposing (Color(..), backgroundColor, color, colorVariable, cw, marginRightCw, panel, panelLabel, select, selectWithStyles, widthCw)

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


selectWithStyles : List Style -> List (Attribute msg) -> List ( String, String ) -> String -> Html msg
selectWithStyles styles attr values val =
    let
        createOption ( v, t ) =
            option [ value v, selected <| v == val ] [ text t ]
    in
    span [ class "select-wrapper", css styles ]
        [ Html.select (value val :: attr) <| List.map createOption values ]


select : List (Attribute msg) -> List ( String, String ) -> String -> Html msg
select =
    selectWithStyles []


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
