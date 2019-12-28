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
