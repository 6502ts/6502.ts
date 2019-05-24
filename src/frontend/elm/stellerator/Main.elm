module Main exposing (main)

import Browser
import Css exposing (..)
import Html
import Html.Styled exposing (..)
import Html.Styled.Attributes exposing (..)


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


panel : String -> List (Attribute msg) -> List (Html msg) -> Html msg
panel label attr content =
    div attr [ div [ class "panel" ] (content ++ [ div [ class "panel-label" ] [ text label ] ]) ]


view : Model -> Html Msg
view model =
    div
        [ class "panel"
        , css
            [ Css.height <| calc (vh 100) minus (rem 1.2)
            , boxSizing borderBox
            , displayFlex
            , flexDirection row
            , flexWrap Css.wrap
            , Css.property "align-content" "flex-start"
            ]
        ]
        [ panel "panel 1"
            [ css [ flex <| pct 50 ] ]
            [ div [ class "panel-label" ]
                [ text "Panel 1:" ]
            , p
                []
                [ text loremIpsum ]
            , p [] [ text "hello world!" ]
            ]
        , panel "panel 2"
            [ css [ flex <| pct 50 ] ]
            [ div [ class "panel-label" ]
                [ text "Panel 2:" ]
            , p
                []
                [ text loremIpsum ]
            , p [] [ text "hello world!" ]
            ]
        , panel "panel 3"
            [ css [ flexGrow <| num 1 ] ]
            [ text "Toolbar"
            ]
        ]


main =
    Browser.sandbox
        { init = Empty
        , update = update
        , view = view >> toUnstyled
        }
