{-
   This file is part of 6502.ts, an emulator for 6502 based systems built
   in Typescript

   Copyright (c) 2014 -- 2020 Christian Speckner and contributors

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
-}


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
