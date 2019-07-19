module Stellerator.View.Modal exposing (modal)

import Css exposing (..)
import Css.Transitions as Tr
import Dos
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Stellerator.Model exposing (Media, Msg(..))
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


dialog : String -> Media -> Html Msg
dialog message media =
    div
        [ Dos.panel
        , A.css
            [ width (vw 100)
            , property "max-width" "calc(80*var(--cw))"
            ]
        ]
        [ div [] [ text message ]
        , div
            [ A.css
                [ displayFlex
                , justifyContent spaceBetween
                , paddingTop (Css.em 2)
                ]
            ]
            [ Form.responsiveButton media [ A.css [ property "width" "calc(8*var(--cw))" ] ] RejectPendingMessage "Cancel"
            , Form.responsiveButton media [ A.css [ property "width" "calc(8*var(--cw))" ] ] ConfirmPendingMessage "OK"
            ]
        ]


modal : ( String, Maybe Msg ) -> Media -> List (Html Msg)
modal ( message, pendingAction ) media =
    let
        isVisible =
            Maybe.map (\_ -> True) pendingAction |> Maybe.withDefault False
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
        [ dialog message media ]
    ]
