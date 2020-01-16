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


module Stellerator.View.About exposing (page)

import Css exposing (..)
import Dos exposing (Color(..), color)
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Markdown
import Stellerator.Model exposing (Model, Msg)


pageElement : Model -> Html Msg
pageElement model =
    let
        changelog =
            Maybe.map
                (\content -> Markdown.toHtml [] content |> fromUnstyled)
                model.changelog
                |> Maybe.withDefault (div [] [ text "loading changelog..." ])

        license =
            Maybe.map
                (\content -> Markdown.toHtml [] content |> fromUnstyled)
                model.license
                |> Maybe.withDefault (div [] [ text "loading license..." ])
    in
    div
        [ A.css
            [ property "padding" "0 var(--cw)"
            , paddingTop (Css.em 1)
            ]
        ]
        [ div
            [ A.id "version"
            , A.css
                [ textAlign center
                , Dos.color Dos.Cyan
                , marginBottom (Css.em 1)
                ]
            ]
            [ text <| "Version " ++ model.version ]
        , div [ A.css [ textAlign center, marginBottom (Css.em 1) ] ] [ text "** CHANGELOG **" ]
        , changelog
        , div [ A.css [ Dos.backgroundColor Dos.Cyan, height (Css.em 0.5), marginBottom (Css.em 1.5) ] ] []
        , div [ A.css [ textAlign center, marginBottom (Css.em 1) ] ] [ text "** LICENSE **" ]
        , license
        ]


page : Model -> List (Html Msg)
page model =
    [ pageElement model ]
