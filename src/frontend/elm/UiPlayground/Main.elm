module UiPlayground.Main exposing (main)

import Browser
import Css exposing (..)
import Dos
import Html.Styled as Html exposing (..)
import Html.Styled.Attributes as A exposing (..)


type Model
    = Empty


type alias Msg =
    ()


update : Msg -> Model -> Model
update _ _ =
    Empty


loremIpsum : String
loremIpsum =
    """
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
"""


view : Model -> Html Msg
view _ =
    let
        br =
            Html.br [] []
    in
    let
        flexItem width =
            css [ flex (pct width), boxSizing borderBox ]
    in
    let
        panel i =
            div [ Dos.panel, Dos.panelLabel ("panel " ++ String.fromInt i ++ ":"), flexItem 50 ]
                [ p
                    []
                    [ text loremIpsum ]
                , p [] [ a [] [ text "This is a link" ] ]
                ]
    in
    let
        form =
            let
                separator =
                    [ br, br ]
            in
            let
                compose x =
                    List.concat <| List.intersperse separator x
            in
            let
                radioLabel x =
                    label [ css [ Dos.marginRightCw 1 ] ] [ text (x ++ ":") ]
            in
            let
                radio isDisabled =
                    input [ type_ "radio", name "radiofoo", A.disabled isDisabled, css [ Dos.marginRightCw 3 ] ] []
            in
            let
                radioSet defs =
                    List.concat <|
                        List.map
                            (\x ->
                                [ radioLabel <| Tuple.first x
                                , radio <| Tuple.second x
                                ]
                            )
                            defs
            in
            let
                radios =
                    radioSet [ ( "Apples", False ), ( "Bananas", False ), ( "Cucumbers", False ), ( "Disabled Pears", True ) ]
            in
            let
                lbl x =
                    label [ css [ Dos.widthCw 20, display inlineBlock ] ] [ text x ]
            in
            let
                items =
                    [ [ lbl "buttons:"
                      , button [ type_ "button" ] [ text "Save" ]
                      , button [ type_ "button", A.disabled True ] [ text "Disabled" ]
                      ]
                    , [ lbl "active input:"
                      , input [ type_ "text", css [ Dos.widthCw 40 ], placeholder "enter some text" ] []
                      ]
                    , [ lbl "disabled input:"
                      , input [ type_ "text", A.disabled True, css [ Dos.widthCw 40 ], placeholder "this is disabled" ] []
                      ]
                    , [ lbl "active checkbox:"
                      , input [ type_ "checkbox" ] []
                      ]
                    , [ lbl "disabled checkbox:"
                      , input [ type_ "checkbox", A.disabled True ] []
                      ]
                    , lbl "radios:"
                        :: radios
                    , [ lbl "slider:"
                      , input [ type_ "range", css [ Dos.widthCw 20 ] ] []
                      ]
                    , [ lbl "dropdown:"
                      , Dos.select [ css [ Dos.widthCw 20 ] ] [ ( "hanni", "Hanni" ), ( "nanni", "Nanni" ), ( "fanni", "Fanni" ) ] "fanni"
                      ]
                    ]
            in
            Html.form [ Dos.panel, Dos.panelLabel "Form:", flexItem 100 ] <| br :: compose items
    in
    let
        headings =
            let
                items =
                    List.concat <|
                        List.indexedMap
                            (\i -> \h -> [ h [] [ text <| "Heading " ++ (String.fromInt <| i + 1) ], p [] [ text loremIpsum ] ])
                            [ h1, h2, h3, h4, h5, h6 ]
            in
            div [ Dos.panel, Dos.panelLabel "Headings:", flexItem 100 ] items
    in
    let
        listItems elt =
            let
                sublist =
                    elt [] <| List.map (\x -> li [] [ text x ]) [ "one", "two" ]
            in
            List.map (\x -> li [] [ text x, sublist ])
                [ "Over there, a cat"
                , "Look, it's chasin' a dog"
                , "Both are getting eaten by an aardvark"
                , "The Aardvark is trampled by a mammoth"
                ]
    in
    let
        unorderedList =
            div [ Dos.panel, Dos.panelLabel "Unordered List:", flexItem 33.333 ] [ ul [] (listItems ul) ]
    in
    let
        orderedList =
            div [ Dos.panel, Dos.panelLabel "Ordered List:", flexItem 33.333 ] [ ol [] (listItems ol) ]
    in
    let
        descriptionList =
            div [ Dos.panel, Dos.panelLabel "Description List:", flexItem 33.333 ]
                [ dl [] <|
                    List.concat <|
                        List.map (\x -> [ dt [] [ text (Tuple.first x) ], dd [] [ text (Tuple.second x) ] ])
                            [ ( "a cat:", "is a small, feline predator" )
                            , ( "a dog:", "is a slightly larger and dumber predator" )
                            , ( "an aardvark:", "is a small, funky anteater" )
                            , ( "a mammoth:", "is a huge, mean squishin' machine" )
                            ]
                ]
    in
    div
        [ class "panel"
        , css
            [ displayFlex
            , flexDirection row
            , flexWrap Css.wrap
            , Css.property "align-content" "flex-start"
            , overflowY scroll
            , overflowX Css.hidden
            ]
        ]
        [ panel 1
        , panel 2
        , form
        , headings
        , unorderedList
        , orderedList
        , descriptionList
        ]


main : Platform.Program () Model Msg
main =
    Browser.sandbox
        { init = Empty
        , update = update
        , view = view >> toUnstyled
        }
