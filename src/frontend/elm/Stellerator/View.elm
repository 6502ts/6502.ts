module Stellerator.View exposing (body, cartridges, emulation, help, settings, view)

import Browser
import Html.Styled exposing (..)
import Html.Styled.Attributes exposing (..)
import Stellerator.Model exposing (..)
import Stellerator.View.Navigation exposing (navigation)


cartridges : Model -> List (Html Msg)
cartridges model =
    navigation model
        ++ [ div [] [ text "Happy scrappy cartridges page " ] ]


settings : Model -> List (Html Msg)
settings model =
    navigation model ++ [ div [] [ text "Happy scrappy settings page" ] ]


emulation : Model -> List (Html Msg)
emulation model =
    navigation model ++ [ div [] [ text "Happy scrappy emulation page" ] ]


help : Model -> List (Html Msg)
help model =
    navigation model ++ [ div [] [ text "Happy scrappy help page" ] ]


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
    { title = "stellerator"
    , body = body model |> List.map toUnstyled
    }
