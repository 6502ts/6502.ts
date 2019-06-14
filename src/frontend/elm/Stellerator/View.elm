module Stellerator.View exposing (body, cartridges, emulation, help, settings, view)

import Browser
import Html.Styled exposing (..)
import Html.Styled.Attributes exposing (..)
import Stellerator.Model exposing (..)
import Stellerator.View.Cartridges as Cartridges
import Stellerator.View.Help as Help
import Stellerator.View.Navigation as Navigation


cartridges : Model -> List (Html Msg)
cartridges model =
    Navigation.navbar model
        ++ Cartridges.page model


settings : Model -> List (Html Msg)
settings model =
    Navigation.navbar model ++ [ div [] [ text "Happy scrappy settings page" ] ]


emulation : Model -> List (Html Msg)
emulation model =
    Navigation.navbar model ++ [ div [] [ text "Happy scrappy emulation page" ] ]


help : Model -> List (Html Msg)
help model =
    Navigation.navbar model ++ Help.page model


body : Model -> List (Html Msg)
body model =
    case model.currentRoute of
        Cartridges ->
            cartridges model

        Settings ->
            settings model

        Emulation ->
            emulation model

        Help ->
            help model


view : Model -> Browser.Document Msg
view model =
    { title = "Stellerator"
    , body = body model |> List.map toUnstyled
    }
