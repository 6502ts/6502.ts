module Stellerator.Main exposing (main)

import Browser
import Browser.Navigation as Nav
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
    ( { key = key, currentRoute = route, media = Wide, emulationState = Stopped }
    , Cmd.batch
        [ Nav.replaceUrl key (serializeRoute route)
        , Ports.watchMedia [ "(max-width: 800px)" ]
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
