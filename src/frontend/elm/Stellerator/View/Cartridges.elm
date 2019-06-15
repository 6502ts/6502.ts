module Stellerator.View.Cartridges exposing (page)

import Css exposing (..)
import Dos exposing (Color(..))
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Stellerator.Model exposing (Model, Msg)


cartridgeToolbar : Model -> Html Msg
cartridgeToolbar _ =
    let
        btn children =
            button [ A.type_ "button", A.css [ property "width" "calc(10 * var(--cw))" ] ] children
    in
    form [ Dos.panel, A.css [ displayFlex, flexDirection column ] ]
        [ div [ A.css [ displayFlex ] ]
            [ input [ A.type_ "text", A.css [ flexGrow (int 1), Dos.marginRightCw 1 ], A.placeholder "Filter cartridges..." ] []
            , button [ A.type_ "button" ] [ text "Clear" ]
            ]
        , div
            [ A.css [ position relative ] ]
            [ btn [ text "Add new" ]
            , btn [ text "Delete" ]
            , btn [ text "Run" ]
            ]
        ]


cartridgeList : Model -> Html Msg
cartridgeList model =
    let
        entry name =
            div
                [ A.css
                    [ nthChild "odd" [ Dos.backgroundColor Cyan ]
                    , nthChild "even" [ Dos.backgroundColor LightGray ]
                    , Dos.color Black
                    , property "padding-left" "var(--cw)"
                    , cursor pointer
                    ]
                ]
                [ text <| " * " ++ name ]
    in
    div [ Dos.panel, A.css [ flexGrow (int 1) ] ] <|
        List.map
            (entry << .name)
            model.cartridges


page : Model -> List (Html Msg)
page model =
    [ div
        [ A.css
            [ height <| calc (vh 100) minus (Css.em 2)
            , displayFlex
            , alignItems stretch
            , paddingTop (Css.em 1)
            , boxSizing borderBox
            ]
        ]
        [ div
            [ A.css
                [ boxSizing borderBox, flexGrow (int 1), flexBasis (px 0), displayFlex, flexDirection column ]
            ]
            [ cartridgeToolbar model
            , cartridgeList
                model
            ]
        , div
            [ Dos.panel
            , Dos.panelLabel "Settings:"
            , A.css
                [ boxSizing borderBox, flexGrow (int 1), flexBasis (px 0) ]
            ]
            []
        ]
    ]
