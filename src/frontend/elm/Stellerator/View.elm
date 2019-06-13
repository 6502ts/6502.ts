module Stellerator.View exposing (body, cartridges, emulation, help, navigation, settings, view)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Stellerator.Model exposing (..)
import Stellerator.Routing exposing (serializeRoute)


navigation : Model -> List (Html Msg)
navigation model =
    let
        media =
            case model.media of
                Narrow ->
                    "narrow"

                Wide ->
                    "wide"
    in
    [ ul [] <|
        List.map
            (\x -> li [] [ x ])
            [ a [ href <| serializeRoute Cartridges ] [ text "Cartridges" ]
            , a [ href <| serializeRoute Settings ] [ text "Settings" ]
            , a [ href <| serializeRoute Emulation ] [ text "Emulation" ]
            , a [ href <| serializeRoute Help ] [ text "Help" ]
            ]
    , div [] [ text ("media: " ++ media) ]
    , br [] []
    ]


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
    , body = body model
    }
