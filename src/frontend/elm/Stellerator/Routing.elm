module Stellerator.Routing exposing (onUrlChange, onUrlRequest, parseRoute, routing, serializeRoute)

import Browser
import Stellerator.Model exposing (Msg(..), Route(..))
import Url exposing (Url)


routing : List ( Route, String )
routing =
    [ ( RouteEmulation, "emulation" )
    , ( RouteSettings, "settings" )
    , ( RouteCartridges, "cartridges" )
    , ( RouteHelp, "help" )
    ]


serializeRoute : Route -> String
serializeRoute route =
    "#" ++ (routing |> List.filter (\( x, _ ) -> x == route) >> List.head >> Maybe.map Tuple.second >> Maybe.withDefault "")


parseRoute : Url -> Maybe Route
parseRoute { fragment } =
    Maybe.andThen (\f -> routing |> List.filter (\( _, x ) -> x == f) >> List.head >> Maybe.map Tuple.first) fragment


onUrlRequest : Browser.UrlRequest -> Msg
onUrlRequest r =
    case r of
        Browser.Internal url ->
            Url.toString url |> NavigateToUrl

        _ ->
            None


onUrlChange : Url -> Msg
onUrlChange =
    parseRoute
        >> Maybe.map ChangeRoute
        >> Maybe.withDefault (serializeRoute RouteCartridges |> NavigateToUrl)
