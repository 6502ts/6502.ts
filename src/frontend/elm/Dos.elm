module Dos exposing (cw, marginRightCw, panel, panelLabel, select, widthCw)

import Css exposing (..)
import Html.Styled as Html exposing (..)
import Html.Styled.Attributes as Attributes exposing (..)


panel : Html.Attribute msg
panel =
    class "panel"


panelLabel : String -> Html.Attribute msg
panelLabel label =
    attribute "data-label" label


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
