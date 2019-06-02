module Dos exposing (cw, marginRightCw, panelWithLabel, panelWithoutLabel, select, widthCw)

import Css exposing (..)
import Html.Styled as Html exposing (..)
import Html.Styled.Attributes as Attributes exposing (..)


panelWithLabel : String -> List (Attribute msg) -> List (Html msg) -> Html msg
panelWithLabel label attr content =
    let
        panelLabel =
            [ Html.label [ class "panel-label" ] [ text label ] ]
    in
    div ([ class "panel" ] ++ attr) (panelLabel ++ content)


panelWithoutLabel : List (Attribute msg) -> List (Html msg) -> Html msg
panelWithoutLabel attr content =
    div ([ class "panel" ] ++ attr) content


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
