module Stellerator.Main exposing (main)

import Browser
import Browser.Navigation as Nav
import Http
import Json.Decode as Decode exposing (..)
import Stellerator.Model exposing (..)
import Stellerator.Ports as Ports
import Stellerator.Routing exposing (..)
import Stellerator.Update exposing (..)
import Stellerator.View exposing (view)
import Url exposing (Url)


type alias Flags =
    { cartridges : List Cartridge
    , cartridgeTypes : List CartridgeType
    , settings : Maybe Settings
    }


decodeFlags : Decoder Flags
decodeFlags =
    map3 Flags
        (field "cartridges" <| list decodeCartridge)
        (field "cartridgeTypes" <| list decodeCartridgeType)
        (Decode.maybe (field "settings" <| decodeSettings))


init : Value -> Url -> Nav.Key -> ( Model, Cmd Msg )
init flagsJson url key =
    let
        flags =
            case decodeValue decodeFlags flagsJson of
                Ok f ->
                    f

                Err _ ->
                    { cartridges = [], cartridgeTypes = [], settings = Maybe.Nothing }
    in
    let
        route : Route
        route =
            parseRoute url |> Maybe.withDefault RouteCartridges
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
      , media = Nothing
      , emulationState = EmulationStopped
      , helppage = Nothing
      , sideMenu = False
      , cartridges = List.sortBy (.name >> String.toUpper) flags.cartridges
      , cartridgeTypes = flags.cartridgeTypes
      , currentCartridgeHash = Nothing
      , cartridgeFilter = ""
      , cartridgeViewMode = CartridgeViewCartridges
      , settings = Maybe.withDefault defaultSettings flags.settings
      }
    , Cmd.batch
        [ Nav.replaceUrl key (serializeRoute route)
        , Ports.watchMedia [ "(max-width: 750px)" ]
        , Http.get { url = "doc/stellerator.md", expect = Http.expectString handleHelppageResult }
        ]
    )


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Ports.onMediaUpdate
            (List.head
                >> Maybe.map
                    (\x ->
                        if x then
                            ChangeMedia MediaNarrow

                        else
                            ChangeMedia MediaWide
                    )
                >> Maybe.withDefault None
            )
        , Ports.onNewCartridges AddNewCartridges
        ]


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
