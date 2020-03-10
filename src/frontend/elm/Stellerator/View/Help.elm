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


module Stellerator.View.Help exposing (page)

import Css exposing (..)
import Css.Global exposing (descendants, selector)
import Dos exposing (Color(..))
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Markdown
import Regex as R exposing (Regex)
import Stellerator.Model exposing (Model, Msg)


relativeUrlRegex : Maybe Regex
relativeUrlRegex =
    R.fromString "(\\[.*?\\])\\((?!/|https?://)(.*?)\\)"


qualifyRelativeLinks : String -> String -> String
qualifyRelativeLinks base markdown =
    let
        replaceMatch : R.Match -> String
        replaceMatch m =
            case m.submatches of
                [ Just labelExp, Just url ] ->
                    labelExp ++ "(" ++ base ++ url ++ ")"

                _ ->
                    ""

        replacedMarkdown : Maybe String
        replacedMarkdown =
            Maybe.map (\r -> R.replace r replaceMatch markdown) relativeUrlRegex
    in
    Maybe.withDefault markdown replacedMarkdown


pageElement : Model -> Html Msg
pageElement model =
    case model.helppage of
        Just content ->
            div
                [ A.css
                    [ property "padding" "0 var(--cw)"
                    , paddingTop (Css.em 1)
                    , descendants [ selector "img" [ width (Css.em 25), property "max-width" "calc(100vw - 2*var(--cw))" ] ]
                    ]
                ]
                [ Markdown.toHtml [] (qualifyRelativeLinks "doc/" content) |> fromUnstyled ]

        Nothing ->
            text "loading..."


page : Model -> List (Html Msg)
page model =
    [ pageElement model ]
