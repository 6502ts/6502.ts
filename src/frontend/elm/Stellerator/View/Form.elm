module Stellerator.View.Form exposing (onInput, picker)

import Css exposing (..)
import Dos
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Html.Styled.Events as E
import Json.Decode as Decode
import List.Extra as LE


onInput : (String -> msg) -> Attribute msg
onInput tagger =
    E.preventDefaultOn "input" <| Decode.map (tagger >> (\m -> ( m, True ))) E.targetValue


picker : List ( String, String ) -> String -> (String -> msg) -> Html msg
picker items value tagger =
    let
        onChange =
            E.preventDefaultOn "change" <| Decode.map (tagger >> (\m -> ( m, True ))) E.targetValue
    in
    Dos.select
        [ A.css [ width (pct 100) ]
        , onChange
        ]
        items
        value
