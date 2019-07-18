module Stellerator.View exposing (view)

import Browser
import Html.Styled exposing (..)
import Html.Styled.Attributes exposing (..)
import Stellerator.Model exposing (..)
import Stellerator.View.Cartridges as Cartridges
import Stellerator.View.Help as Help
import Stellerator.View.Navigation as Navigation
import Stellerator.View.Settings as Settings


emulation : List (Html Msg)
emulation =
    [ div [] [ text "Happy scrappy emulation page" ] ]


body : Model -> List (Html Msg)
body model =
    let
        navbar =
            Maybe.map (Navigation.navbar model) model.media |> Maybe.withDefault []
    in
    let
        content =
            case ( model.currentRoute, model.media ) of
                ( RouteCartridges, Just media ) ->
                    Cartridges.page model media

                ( RouteSettings, Just media ) ->
                    Settings.page model media

                ( RouteEmulation, Just _ ) ->
                    emulation

                ( RouteHelp, Just _ ) ->
                    Help.page model

                _ ->
                    []
    in
    navbar ++ content


view : Model -> Browser.Document Msg
view model =
    { title = "Stellerator"
    , body = body model |> List.map toUnstyled
    }
