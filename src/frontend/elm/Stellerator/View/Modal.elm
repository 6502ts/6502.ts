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


module Stellerator.View.Modal exposing (modal)

import Css exposing (..)
import Css.Transitions as Tr
import Dos
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Stellerator.Model
    exposing
        ( Media
        , MessagePending
        , MessagePendingMetadata(..)
        , Msg(..)
        )
import Stellerator.View.Form as Form


backdrop : Bool -> Html Msg
backdrop isVisible =
    let
        visibility =
            if isVisible then
                []

            else
                [ display none ]
    in
    div
        [ A.css <|
            visibility
                ++ [ position fixed
                   , top (px 0)
                   , left (px 0)
                   , width (vw 100)
                   , height (vh 100)
                   , zIndex (int 100)
                   , backgroundColor (rgba 0 0 0 0.5)
                   ]
        ]
        []


dialog : MessagePending -> Media -> Html Msg
dialog messagePending media =
    let
        txt =
            case messagePending of
                ( _, MessagePendingAck t _ ) ->
                    t

                ( _, MessagePendingConfirmOrReject t _ ) ->
                    t
    in
    let
        buttons styles =
            case messagePending of
                ( _, MessagePendingAck _ l ) ->
                    div
                        [ A.css <| [ displayFlex, justifyContent flexEnd ] ++ styles
                        ]
                        [ Form.responsiveButton
                            media
                            [ A.css [ property "width" "calc(8*var(--cw))" ] ]
                            ConfirmPendingMessage
                            l
                        ]

                ( _, MessagePendingConfirmOrReject _ ( lConfirm, lReject ) ) ->
                    div
                        [ A.css <| [ displayFlex, justifyContent spaceBetween ] ++ styles
                        ]
                        [ Form.responsiveButton
                            media
                            [ A.css [ property "width" "calc(8*var(--cw))" ] ]
                            RejectPendingMessage
                            lReject
                        , Form.responsiveButton
                            media
                            [ A.css [ property "width" "calc(8*var(--cw))" ] ]
                            ConfirmPendingMessage
                            lConfirm
                        ]
    in
    div
        [ Dos.panel
        , A.css
            [ width (vw 100)
            , property "max-width" "calc(80*var(--cw))"
            ]
        ]
        [ div [] [ text txt ]
        , buttons [ paddingTop (Css.em 2) ]
        ]


modal : MessagePending -> Media -> List (Html Msg)
modal messagePending media =
    let
        isVisible =
            case messagePending of
                ( Just _, _ ) ->
                    True

                _ ->
                    False
    in
    [ backdrop isVisible
    , div
        [ A.css
            [ position fixed
            , top (px 0)
            , left (px 0)
            , width (vw 100)
            , zIndex (int 150)
            , displayFlex
            , justifyContent center
            , Tr.transition [ Tr.transform 300 ]
            , if isVisible then
                transform <| translateY (pct 0)

              else
                transform <| translateY (pct -100)
            ]
        ]
        [ dialog messagePending media ]
    ]
