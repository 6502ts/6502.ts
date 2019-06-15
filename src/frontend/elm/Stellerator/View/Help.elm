module Stellerator.View.Help exposing (page)

import Css exposing (..)
import Css.Global exposing (global, selector)
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Markdown
import Regex as R exposing (Regex)
import Stellerator.Model exposing (Model, Msg)


relativeUrlRegex : Maybe Regex
relativeUrlRegex =
    R.fromString "(\\[.*?\\])\\((?!/|https?://)(.*?)\\)"


qualifyRelativeLinks : String -> String -> String
qualifyRelativeLinks base markdown =
    let
        replaceMatch : R.Match -> String
        replaceMatch m =
            case m.submatches of
                [ Just labelExp, Just url ] ->
                    labelExp ++ "(" ++ base ++ url ++ ")"

                _ ->
                    ""
    in
    let
        replacedMarkdown : Maybe String
        replacedMarkdown =
            Maybe.map (\r -> R.replace r replaceMatch markdown) relativeUrlRegex
    in
    Maybe.withDefault markdown replacedMarkdown


pageElement : Model -> Html Msg
pageElement model =
    case model.helppage of
        Just content ->
            div [ A.class "helppage", A.css [ property "padding" "0 var(--cw)", paddingTop (Css.em 1) ] ]
                [ Markdown.toHtml [] (qualifyRelativeLinks "doc/" content) |> fromUnstyled
                ]

        Nothing ->
            text "loading..."


page : Model -> List (Html Msg)
page model =
    [ pageElement model
    , global <| [ selector ".helppage img" [ property "max-width" "calc(100vw - 2 * var(--cw))" ] ]
    ]
