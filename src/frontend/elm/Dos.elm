module Dos exposing (panelWithLabel, panelWithoutLabel)

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
