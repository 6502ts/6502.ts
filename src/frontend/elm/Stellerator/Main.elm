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


module Stellerator.Main exposing (main)

import Browser
import Browser.Navigation as Nav
import Http
import Json.Decode exposing (..)
import Stellerator.Media exposing (..)
import Stellerator.Model exposing (..)
import Stellerator.Ports as Ports
import Stellerator.Routing exposing (..)
import Stellerator.Update exposing (..)
import Stellerator.View exposing (view)
import Url exposing (Url)


type alias Flags =
    { cartridges : List Cartridge
    , cartridgeTypes : List CartridgeType
    , settings : Settings
    , defaultSettings : Settings
    , touchSupport : Bool
    , version : String
    , wasUpdated : Bool
    , gamepadCount : Int
    }


decodeFlags : Decoder Flags
decodeFlags =
    map8 Flags
        (field "cartridges" <| list decodeCartridge)
        (field "cartridgeTypes" <| list decodeCartridgeType)
        (field "settings" <| decodeSettings)
        (field "defaultSettings" <| decodeSettings)
        (field "touchSupport" <| bool)
        (field "version" <| string)
        (field "wasUpdated" <| bool)
        (field "gamepadCount" <| int)



-- Attention unwary reader: this are not the default settings, but just a fallback
-- to satisfy the compiler. The defaults are found in Storage.ts .


fallbackSettings : Settings
fallbackSettings =
    { cpuEmulation = AccuracyCycle
    , volume = 80
    , audioEmulation = AudioPCM
    , gammaCorrection = 1.0
    , tvEmulation = TvEmulationComposite
    , scaling = ScalingQis
    , phosphorLevel = 50
    , scanlineIntensity = 20
    , touchControls = Maybe.Nothing
    , leftHanded = False
    , virtualJoystickSensitivity = 10
    , uiMode = Nothing
    , uiSize = 100
    }


init : Value -> Url -> Nav.Key -> ( Model, Cmd Msg )
init flagsJson url key =
    let
        flags =
            case decodeValue decodeFlags flagsJson of
                Ok f ->
                    f

                Err _ ->
                    { cartridges = []
                    , cartridgeTypes = []
                    , settings = fallbackSettings
                    , defaultSettings = fallbackSettings
                    , touchSupport = False
                    , version = "[unknown]"
                    , wasUpdated = False
                    , gamepadCount = 0
                    }

        route : Route
        route =
            parseRoute url |> Maybe.withDefault RouteCartridges

        handleRequestResult a =
            Http.expectString <|
                \r ->
                    case r of
                        Ok content ->
                            a content

                        Err _ ->
                            None

        model =
            { key = key
            , currentRoute = route
            , media = Nothing
            , touchSupport = flags.touchSupport
            , emulationState = EmulationStopped
            , helppage = Nothing
            , changelog = Nothing
            , license = Nothing
            , sideMenu = False
            , cartridges = flags.cartridges
            , cartridgeTypes = flags.cartridgeTypes
            , currentCartridgeHash = Nothing
            , runningCartridgeHash = Nothing
            , cartridgeFilter = ""
            , cartridgeViewMode = CartridgeViewCartridges
            , settings = flags.settings
            , defaultSettings = flags.defaultSettings
            , messagePending =
                if flags.wasUpdated then
                    ( Just NavigateToAboutPage
                    , MessagePendingConfirmOrReject ("Stellerator has been updated to version " ++ flags.version ++ ".") ( "Changelog", "Close" )
                    )

                else
                    ( Nothing, MessagePendingAck "" "" )
            , emulationPaused = False
            , showMessageOnPause = False
            , limitFramerate = True
            , consoleSwitches =
                { difficultyP0 = DifficultyPro
                , difficultyP1 = DifficultyPro
                , color = ColorColor
                }
            , gamepadCount = flags.gamepadCount
            , version = flags.version
            }
    in
    ( model
    , Cmd.batch
        [ Nav.replaceUrl key (serializeRoute route)
        , watchMediaCommand model.settings.uiSize
        , Http.get { url = "doc/stellerator.md", expect = handleRequestResult SetHelpPage }
        , Http.get { url = "CHANGELOG.md", expect = handleRequestResult SetChangelog }
        , Http.get { url = "LICENSE.md", expect = handleRequestResult SetLicense }
        ]
    )


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ watchMediaSubscription
        , Ports.onNewCartridges AddNewCartridges
        , Ports.onEmulationStateChange UpdateEmulationState
        , Ports.onInputDriverEvent IncomingInputDriverEvent
        , Ports.onUpdateGamepadCount UpdateGamepadCount
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
