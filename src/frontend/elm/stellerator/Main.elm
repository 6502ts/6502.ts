module Main exposing (main)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)


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
    div [ class "panel" ]
        [ div [ class "panel-label" ]
            [ text "some label:" ]
        , p
            []
            [ text loremIpsum ]
        , p [] [ text "hello world!" ]
        ]


main =
    Browser.sandbox
        { init = Empty
        , update = update
        , view = view
        }
