module Stellerator.Model exposing (EmulationState(..), Media(..), Model, Msg(..), Route(..), update)

import Browser.Navigation as Nav


type Route
    = Cartridges
    | Settings
    | Emulation
    | Help


type Media
    = Narrow
    | Wide


type EmulationState
    = Stopped
    | Paused
    | Running (Maybe Float)


type alias Model =
    { key : Nav.Key
    , currentRoute : Route
    , media : Media
    , emulationState : EmulationState
    }


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
            let
                emulationState =
                    case route of
                        Cartridges ->
                            Stopped

                        Settings ->
                            Paused

                        Emulation ->
                            Running (Just 3.55)

                        Help ->
                            Running Nothing
            in
            ( { model | currentRoute = route, emulationState = emulationState }, Cmd.none )

        ChangeMedia media ->
            ( { model | media = media }, Cmd.none )

        _ ->
            ( model, Cmd.none )
