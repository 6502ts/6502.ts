module Stellerator.Main exposing (main)

import Browser
import Css exposing (..)
import Dos
import Html
import Html.Styled as H exposing (..)
import Html.Styled.Attributes as A exposing (..)


type Model
    = Empty


type Msg
    = None


update : Msg -> Model -> Model
update msg model =
    Empty


loremIpsum : String
loremIpsum =
    """
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
"""


view : Model -> Html Msg
view model =
    let
        lbl x =
            label [ css [ Dos.widthCw 20, display inlineBlock ] ] [ text x ]
    in
    Dos.panelWithoutLabel
        [ css
            [ Css.height (vh 100)
            , boxSizing borderBox
            , displayFlex
            , flexDirection row
            , flexWrap Css.wrap
            , Css.property "align-content" "flex-start"
            , overflowY scroll
            , overflowX Css.hidden
            ]
        ]
        [ Dos.panelWithLabel "panel 1:"
            [ css [ flex <| pct 50, boxSizing borderBox ] ]
            [ p
                []
                [ text loremIpsum ]
            , p [] [ text "hello world!" ]
            ]
        , Dos.panelWithLabel "panel 2:"
            [ css [ flex <| pct 50, boxSizing borderBox ] ]
            [ p
                []
                [ text loremIpsum ]
            , p [] [ text "hello world!" ]
            ]
        , Dos.panelWithLabel "Form elements:"
            [ css [ flexGrow <| num 1, boxSizing borderBox ] ]
            [ br [] []
            , lbl "buttons:"
            , button [] [ text "Save" ]
            , button [ A.disabled True ] [ text "Disabled" ]
            , br [] []
            , lbl "active input:"
            , input [ type_ "text", css [ Dos.widthCw 40 ], placeholder "enter some text" ] []
            , br [] []
            , br [] []
            , lbl "disabled input:"
            , input [ type_ "text", A.disabled True, css [ Dos.widthCw 40 ], placeholder "this is disabled" ] []
            , br [] []
            , br [] []
            , lbl "active checkbox:"
            , input [ type_ "checkbox" ] []
            , br [] []
            , br [] []
            , lbl "disabled checkbox:"
            , input [ type_ "checkbox", A.disabled True ] []
            , br [] []
            , br [] []
            , lbl "radios:"
            , label [ css [ Dos.marginRightCw 1 ] ] [ text "Apples:" ]
            , input [ type_ "radio", name "radiofoo", css [ Dos.marginRightCw 3 ] ] []
            , label [ css [ Dos.marginRightCw 1 ] ] [ text "Bananas:" ]
            , input [ type_ "radio", name "radiofoo", css [ Dos.marginRightCw 3 ] ] []
            , label [ css [ Dos.marginRightCw 1 ] ] [ text "Cucumbers:" ]
            , input [ type_ "radio", name "radiofoo", css [ Dos.marginRightCw 3 ] ] []
            , label [ css [ Dos.marginRightCw 1 ] ] [ text "Disabled pear:" ]
            , input [ type_ "radio", name "radiofoo", A.disabled True, css [ Dos.marginRightCw 3 ] ] []
            , br [] []
            , br [] []
            , lbl "slider:"
            , input [ type_ "range", css [ Dos.widthCw 20 ] ] []
            , br [] []
            , br [] []
            , lbl "dropdown:"
            , Dos.select [ css [ Dos.widthCw 20 ] ] [ ( "hanni", "Hanni" ), ( "nanni", "Nanni" ), ( "fanni", "Fanni" ) ]
            ]
        ]


main =
    Browser.sandbox
        { init = Empty
        , update = update
        , view = view >> toUnstyled
        }
