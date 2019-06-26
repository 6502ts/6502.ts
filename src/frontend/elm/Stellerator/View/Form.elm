module Stellerator.View.Form exposing
    ( mobileButton
    , onChange
    , onCheckChange
    , onInput
    , picker
    , radioGroup
    )

import Css exposing (..)
import Dos
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Html.Styled.Events as E
import Json.Decode as Decode


onInput : (String -> msg) -> Attribute msg
onInput tagger =
    E.preventDefaultOn "input" <| Decode.map (tagger >> (\m -> ( m, True ))) E.targetValue


onCheckChange : (Bool -> msg) -> Attribute msg
onCheckChange tagger =
    E.preventDefaultOn "change" <| Decode.map (tagger >> (\m -> ( m, True ))) E.targetChecked


onChange : (String -> msg) -> Attribute msg
onChange tagger =
    E.preventDefaultOn "change" <| Decode.map (tagger >> (\m -> ( m, True ))) E.targetValue


picker : List ( String, String ) -> (String -> msg) -> String -> Html msg
picker items tagger value =
    Dos.select
        [ A.css [ width (pct 100) ]
        , onChange tagger
        ]
        items
        value


mobileButton : List (Attribute msg) -> msg -> String -> Html msg
mobileButton attr msg label =
    span
        [ E.custom "click" <|
            Decode.succeed
                { message = msg
                , stopPropagation = True
                , preventDefault = True
                }
        ]
        [ button attr [ text label ]
        ]


radioGroup : List (Attribute msg) -> List ( a, String ) -> (a -> msg) -> a -> Html msg
radioGroup attributes items tagger value =
    let
        radio item =
            label
                [ A.css [ cursor pointer, Dos.marginRightCw 2, whiteSpace noWrap ] ]
                [ text <| Tuple.second item
                , input
                    [ A.type_ "radio"
                    , A.css [ property "margin-left" "var(--cw)" ]
                    , A.checked <| value == Tuple.first item
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
    span attributes <| List.map radio items
