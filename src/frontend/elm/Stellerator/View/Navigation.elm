module Stellerator.View.Navigation exposing (navigation)

import Css exposing (..)
import Css.Global exposing (global, selector)
import Dos exposing (Color(..))
import FormatNumber exposing (format)
import FormatNumber.Locales exposing (usLocale)
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Stellerator.Model exposing (EmulationState(..), Model, Msg, Route(..))
import Stellerator.Routing exposing (serializeRoute)


navigationLink : Model -> Route -> String -> Html msg
navigationLink model route label =
    let
        color =
            if model.currentRoute == route then
                Dos.color White

            else
                Dos.color Black
    in
    let
        background =
            if model.currentRoute == route then
                Dos.backgroundColor DarkGray

            else
                backgroundColor inherit
    in
    a
        [ A.href <| serializeRoute route
        , A.css
            [ Css.property "padding" "0 var(--cw)"
            , color |> important
            , background |> important
            , textDecoration none |> important
            , display inlineBlock
            ]
        ]
        [ text label ]


emulationState : Model -> String
emulationState model =
    case model.emulationState of
        Stopped ->
            "stopped"

        Paused ->
            "paused"

        Running Nothing ->
            "running"

        Running (Just speed) ->
            "running: " ++ format { usLocale | decimals = 2 } speed ++ " MHz"


navigation : Model -> List (Html Msg)
navigation model =
    [ div
        [ A.css
            [ Css.width (vw 100)
            , Css.height (Css.em 2)
            , position fixed
            , top (px 0)
            , left (px 0)
            , Dos.color LightGray
            , Dos.backgroundColor Black
            ]
        ]
        [ div [ A.css [ textAlign center ] ] [ text "----====≡≡≡≡ 6502.ts / Stellerator ≡≡≡≡====----" ]
        , div [ A.css [ Dos.backgroundColor LightGray, Dos.color Black ] ]
            [ navigationLink model Cartridges "Cartridges"
            , navigationLink model Settings "Settings"
            , navigationLink model Emulation "Emulation"
            , navigationLink model Help "Help"
            , span [ A.css [ float right, property "margin-right" "var(--cw)" ] ] [ text <| emulationState model ]
            ]
        ]
    , global <| [ selector "body" [ paddingTop (Css.em 3) ] ]
    ]
