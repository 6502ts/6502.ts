module Stellerator.Model exposing (Media(..), Model, Msg(..), Route(..), update)

import Browser
import Browser.Navigation as Nav
import Url exposing (Url)


type Route
    = Cartridges
    | Settings
    | Emulation
    | Help


type Media
    = Narrow
    | Wide


type alias Model =
    { key : Nav.Key, currentRoute : Route, media : Media }


type Msg
    = NavigateToUrl String
    | ChangeRoute Route
    | ChangeMedia Media
    | None


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NavigateToUrl url ->
            ( model, Nav.pushUrl model.key url )

        ChangeRoute route ->
            ( { model | currentRoute = route }, Cmd.none )

        ChangeMedia media ->
            ( { model | media = media }, Cmd.none )

        _ ->
            ( model, Cmd.none )
