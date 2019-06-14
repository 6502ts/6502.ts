module Stellerator.View.Help exposing (page)

import Css exposing (..)
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


page : Model -> Html Msg
page model =
    case model.helppage of
        Just content ->
            div [ A.css [ property "padding" "0 var(--cw)" ] ]
                [ Markdown.toHtml [] (qualifyRelativeLinks "doc/" content) |> fromUnstyled
                ]

        Nothing ->
            text "loading..."
