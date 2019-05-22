module Main exposing (main)

import Browser
import Html exposing (..)


type Model
    = Empty


type Msg
    = None


update : Msg -> Model -> Model
update msg model =
    Empty


view : Model -> Html Msg
view model =
    h1 [] [ text "Welcome to Stellerator" ]


main =
    Browser.sandbox
        { init = Empty
        , update = update
        , view = view
        }
