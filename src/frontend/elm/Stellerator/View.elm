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


module Stellerator.View exposing (view)

import Browser
import Css as C
import Css.Global as G
import Html.Styled exposing (..)
import Html.Styled.Attributes exposing (..)
import Stellerator.Model exposing (..)
import Stellerator.View.Cartridges as Cartridges
import Stellerator.View.Emulation as Emulation
import Stellerator.View.Help as Help
import Stellerator.View.Modal exposing (modal)
import Stellerator.View.Navigation as Navigation
import Stellerator.View.Settings as Settings


body : Model -> List (Html Msg)
body model =
    let
        media =
            effectiveMedia model

        navbar =
            Maybe.map (Navigation.navbar model) media |> Maybe.withDefault []

        configureSize =
            let
                fontSize =
                    C.px <| toFloat model.settings.uiSize / 100 * 18
            in
            G.global <| [ G.body [ C.fontSize fontSize, C.lineHeight fontSize ] ]

        content =
            case ( model.currentRoute, media ) of
                ( RouteCartridges, Just m ) ->
                    Cartridges.page model m

                ( RouteSettings, Just m ) ->
                    Settings.page model m

                ( RouteEmulation, Just _ ) ->
                    Emulation.page model

                ( RouteHelp, Just _ ) ->
                    Help.page model

                ( RouteChangelog, Just _ ) ->
                    Help.page model

                _ ->
                    []
    in
    configureSize
        :: navbar
        ++ (Maybe.map (modal model.messagePending) media |> Maybe.withDefault [])
        ++ content


view : Model -> Browser.Document Msg
view model =
    { title = runningCartridge model |> Maybe.map (\x -> "Stellerator: " ++ x.name) |> Maybe.withDefault "Stellerator"
    , body = body model |> List.map toUnstyled
    }
