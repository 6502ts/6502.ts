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
        [ Html.select ([ value val, autocomplete False ] ++ attr) <| List.map createOption values ]


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
