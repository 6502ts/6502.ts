module Stellerator.Main exposing (main)

import Browser
import Browser.Navigation as Nav
import Http
import Stellerator.Model exposing (..)
import Stellerator.Ports as Ports
import Stellerator.Routing exposing (..)
import Stellerator.View exposing (view)
import Url exposing (Url)


init : () -> Url -> Nav.Key -> ( Model, Cmd Msg )
init _ url key =
    let
        route : Route
        route =
            parseRoute url |> Maybe.withDefault Cartridges
    in
    let
        handleHelppageResult r =
            case r of
                Ok content ->
                    SetHelpPage content

                Err _ ->
                    None
    in
    ( { key = key
      , currentRoute = route
      , media = Wide
      , emulationState = Stopped
      , helppage = Nothing
      }
    , Cmd.batch
        [ Nav.replaceUrl key (serializeRoute route)
        , Ports.watchMedia [ "(max-width: 800px)" ]
        , Http.get { url = "doc/stellerator.md", expect = Http.expectString handleHelppageResult }
        ]
    )


subscriptions : Model -> Sub Msg
subscriptions _ =
    Ports.mediaUpdate
        (List.head
            >> Maybe.map
                (\x ->
                    if x then
                        ChangeMedia Narrow

                    else
                        ChangeMedia Wide
                )
            >> Maybe.withDefault None
        )


main : Platform.Program () Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlRequest = onUrlRequest
        , onUrlChange = onUrlChange
        }
