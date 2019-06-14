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
    , helppage : Maybe String
    , sideMenu : Bool
    }


type Msg
    = NavigateToUrl String
    | ChangeRoute Route
    | ChangeMedia Media
    | SetHelpPage String
    | ToggleSideMenu
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
            ( { model
                | currentRoute = route
                , emulationState = emulationState
                , sideMenu = False
              }
            , Cmd.none
            )

        ChangeMedia media ->
            ( { model | media = media }, Cmd.none )

        SetHelpPage content ->
            ( { model | helppage = Just content }, Cmd.none )

        ToggleSideMenu ->
            ( { model | sideMenu = not model.sideMenu }, Cmd.none )

        _ ->
            ( model, Cmd.none )
