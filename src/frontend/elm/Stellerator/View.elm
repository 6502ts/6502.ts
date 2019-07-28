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
    in
    let
        navbar =
            Maybe.map (Navigation.navbar model) media |> Maybe.withDefault []
    in
    let
        configureSize =
            let
                fontSize =
                    C.px <| toFloat model.settings.uiSize / 100 * 18
            in
            G.global <| [ G.body [ C.fontSize fontSize, C.lineHeight fontSize ] ]
    in
    let
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

                _ ->
                    []
    in
    configureSize
        :: navbar
        ++ (Maybe.map (modal model.messageNeedsConfirmation) media |> Maybe.withDefault [])
        ++ content


view : Model -> Browser.Document Msg
view model =
    { title = "Stellerator"
    , body = body model |> List.map toUnstyled
    }
