module Stellerator.Main exposing (main)

import Browser
import Browser.Navigation as Nav
import Html as Html exposing (..)
import Html.Attributes as A exposing (..)
import Url exposing (Url)



-- Model


type alias Model =
    { key : Nav.Key, currentRoute : Route }


type Msg
    = NavigateToUrl String
    | ChangeRoute Route
    | None


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NavigateToUrl url ->
            ( model, Nav.pushUrl model.key url )

        ChangeRoute route ->
            ( { model | currentRoute = route }, Cmd.none )

        _ ->
            ( model, Cmd.none )



-- View


navigation : Model -> List (Html Msg)
navigation _ =
    [ ul [] <|
        List.map
            (\x -> li [] [ x ])
            [ a [ href <| serializeRoute Cartridges ] [ text "Cartridges" ]
            , a [ href <| serializeRoute Settings ] [ text "Settings" ]
            , a [ href <| serializeRoute Emulation ] [ text "Emulation" ]
            , a [ href <| serializeRoute Help ] [ text "Help" ]
            ]
    ]


cartridges : Model -> List (Html Msg)
cartridges model =
    navigation model ++ [ div [] [ text "Happy scrappy cartridges page" ] ]


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



-- Routing


type Route
    = Cartridges
    | Settings
    | Emulation
    | Help


routing : List ( Route, String )
routing =
    [ ( Emulation, "emulation" )
    , ( Settings, "settings" )
    , ( Cartridges, "cartridges" )
    , ( Help, "help" )
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
        >> Maybe.withDefault (serializeRoute Emulation |> NavigateToUrl)



-- Bootstrap


init : () -> Url -> Nav.Key -> ( Model, Cmd Msg )
init _ url key =
    let
        route : Route
        route =
            parseRoute url |> Maybe.withDefault Cartridges
    in
    ( { key = key, currentRoute = route }, Nav.replaceUrl key (serializeRoute route) )


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none


main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlRequest = onUrlRequest
        , onUrlChange = onUrlChange
        }
