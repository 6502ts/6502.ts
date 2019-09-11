module Stellerator.View.Form exposing
    ( checkbox
    , mobileButton
    , onChange
    , onCheckChange
    , onInput
    , picker
    , radioGroup
    , responsiveButton
    , slider
    , textInput
    )

import Css exposing (..)
import Dos
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Html.Styled.Events as E
import Html.Styled.Lazy as Lazy
import Json.Decode as Decode
import Stellerator.Model exposing (Media(..))


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
    Dos.selectWithStyles [ maxWidth (pct 100) ]
        [ A.css [ maxWidth (pct 100) ]
        , onChange tagger
        ]
        items
        value


textInput : List (Attribute msg) -> String -> Html msg
textInput attr =
    Lazy.lazy
        (\v ->
            input
                (A.type_ "text"
                    :: A.value v
                    :: attr
                )
                []
        )


mobileButton : List (Attribute msg) -> msg -> String -> Html msg
mobileButton attr msg label =
    span
        [ A.css
            [ display inlineBlock
            , pseudoClass "not(:last-child)" [ property "margin-right" "var(--cw)" ]
            ]
        , E.custom "click" <|
            Decode.succeed
                { message = msg
                , stopPropagation = True
                , preventDefault = True
                }
        ]
        [ button (A.css [ property "margin-right" "var(--cw)" |> important ] :: attr) [ text label ]
        ]


responsiveButton : Media -> List (Attribute msg) -> msg -> String -> Html msg
responsiveButton media attr msg label =
    case media of
        MediaNarrow ->
            mobileButton attr msg label

        MediaWide ->
            button (E.onClick msg :: attr) [ text label ]


radioGroup : List (Attribute msg) -> List ( a, String ) -> (a -> msg) -> a -> Html msg
radioGroup attributes items tagger value =
    let
        radio item =
            label
                [ A.css [ cursor pointer, whiteSpace noWrap, pseudoClass "not(:first-of-type)" [ property "margin-left" "calc(2 * var(--cw))" ] ] ]
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


slider : List Style -> ( Int, Int ) -> (Maybe Int -> msg) -> (Int -> String) -> Int -> Html msg
slider styles ( min, max ) tagger formatter value =
    let
        validateValue i =
            if i >= min && i <= max then
                Just i

            else
                Nothing
    in
    let
        onKeyDown =
            E.on "keydown" <|
                Decode.andThen
                    (\key ->
                        case key of
                            "ArrowLeft" ->
                                validateValue (value - 1) |> tagger |> Decode.succeed

                            "ArrowRight" ->
                                validateValue (value + 1) |> tagger |> Decode.succeed

                            _ ->
                                Decode.fail ""
                    )
                    (Decode.field "key" Decode.string)
    in
    span
        [ A.css (styles ++ [ display inlineFlex ])
        , A.tabindex 0
        , onKeyDown
        ]
        [ input
            [ A.css [ flexGrow (int 1) ]
            , A.type_ "range"
            , A.min <| String.fromInt min
            , A.max <| String.fromInt max
            , A.value <| String.fromInt value
            , onInput
                (String.toInt
                    >> Maybe.andThen validateValue
                    >> tagger
                )
            ]
            []
        , span
            [ A.css
                [ display block
                , property "padding-left" "calc(2 * var(--cw))"
                , property "min-width" "calc(4 * var(--cw))"
                , flexGrow (int 0)
                , flexShrink (int 0)
                ]
            ]
            [ text <| formatter value ]
        ]


checkbox : (Bool -> msg) -> Bool -> Html msg
checkbox tagger value =
    input
        [ A.type_ "checkbox"
        , onCheckChange tagger
        , A.checked value
        ]
        []
