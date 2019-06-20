module Stellerator.View.Form exposing (onCheckChange, onInput, picker, radioGroup)

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


onCheckChange : (Bool -> msg) -> Attribute msg
onCheckChange tagger =
    E.preventDefaultOn "change" <| Decode.map (tagger >> (\m -> ( m, True ))) E.targetChecked


picker : List ( String, String ) -> (String -> msg) -> String -> Html msg
picker items tagger value =
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


radioGroup : List (Attribute msg) -> String -> List ( a, String ) -> (a -> msg) -> a -> Html msg
radioGroup attributes name items tagger value =
    let
        radio idx item =
            let
                id =
                    name ++ "-" ++ String.fromInt idx
            in
            span [ A.css [ whiteSpace noWrap, Dos.marginRightCw 2 ] ]
                [ label
                    [ A.css
                        [ property "padding-right" "var(--cw)"
                        ]
                    , A.for id
                    ]
                    [ text <| Tuple.second item ]
                , input
                    [ A.type_ "radio"
                    , A.checked <| value == Tuple.first item
                    , A.id id
                    , E.preventDefaultOn "change"
                        << Decode.map (\m -> ( m, True ))
                        << Decode.andThen
                            (\c ->
                                if c then
                                    Decode.succeed <| tagger <| Tuple.first item

                                else
                                    Decode.fail ""
                            )
                      <|
                        E.targetChecked
                    ]
                    []
                ]
    in
    span attributes <| List.indexedMap radio items
