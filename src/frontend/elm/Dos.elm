module Dos exposing (cw, eltAsPanel, eltAsPanelWithLabel, form, formWithLabel, marginRightCw, panelWithLabel, panelWithoutLabel, select, widthCw)

import Css exposing (..)
import Html.Styled as Html exposing (..)
import Html.Styled.Attributes as Attributes exposing (..)


eltAsPanelWithLabel : (List (Attribute msg) -> List (Html msg) -> Html msg) -> String -> List (Attribute msg) -> List (Html msg) -> Html msg
eltAsPanelWithLabel elt label attr content =
    elt ([ class "panel", attribute "data-label" label ] ++ attr) content


eltAsPanel : (List (Attribute msg) -> List (Html msg) -> Html msg) -> List (Attribute msg) -> List (Html msg) -> Html msg
eltAsPanel elt attr content =
    elt ([ class "panel" ] ++ attr) content


panelWithLabel : String -> List (Attribute msg) -> List (Html msg) -> Html msg
panelWithLabel =
    eltAsPanelWithLabel div


panelWithoutLabel : List (Attribute msg) -> List (Html msg) -> Html msg
panelWithoutLabel =
    eltAsPanel div


formWithLabel : String -> List (Attribute msg) -> List (Html msg) -> Html msg
formWithLabel =
    eltAsPanelWithLabel Html.form


form : List (Attribute msg) -> List (Html msg) -> Html msg
form =
    eltAsPanel Html.form


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
