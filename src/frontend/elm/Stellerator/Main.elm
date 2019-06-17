module Stellerator.Main exposing (main)

import Browser
import Browser.Navigation as Nav
import Http
import Json.Decode exposing (..)
import Stellerator.Model exposing (..)
import Stellerator.Ports as Ports
import Stellerator.Routing exposing (..)
import Stellerator.View exposing (view)
import Url exposing (Url)


type alias Flags =
    { cartridges : List Cartridge
    , cartridgeTypes : List CartridgeType
    }


decodeFlags : Decoder Flags
decodeFlags =
    map2 Flags
        (field "cartridges" <| list decodeCartridge)
        (field "cartridgeTypes" <| list decodeCartridgeType)


init : Value -> Url -> Nav.Key -> ( Model, Cmd Msg )
init flagsJson url key =
    let
        flags =
            case decodeValue decodeFlags flagsJson of
                Ok f ->
                    f

                Err _ ->
                    { cartridges = [], cartridgeTypes = [] }
    in
    let
        route : Route
        route =
            parseRoute url |> Maybe.withDefault Cartridges
    in
    let
        handleHelppageResult r =
            case r of
                Ok content ->
                    SetHelpPage content

                Err _ ->
                    None
    in
    ( { key = key
      , currentRoute = route
      , media = Wide
      , emulationState = Stopped
      , helppage = Nothing
      , sideMenu = False
      , cartridges = flags.cartridges
      , cartridgeTypes = flags.cartridgeTypes
      , currentCartridgeHash = Nothing
      , cartridgeFilter = ""
      }
    , Cmd.batch
        [ Nav.replaceUrl key (serializeRoute route)
        , Ports.watchMedia [ "(max-width: 800px)" ]
        , Http.get { url = "doc/stellerator.md", expect = Http.expectString handleHelppageResult }
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


main : Platform.Program Value Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlRequest = onUrlRequest
        , onUrlChange = onUrlChange
        }
