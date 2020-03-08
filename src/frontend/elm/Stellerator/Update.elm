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


module Stellerator.Update exposing (update)

import Browser.Navigation as Nav
import Dict
import List.Extra as LE
import Stellerator.Media exposing (watchMediaCommand)
import Stellerator.Model exposing (..)
import Stellerator.Ports as Ports
import Stellerator.Routing as Routing


updateCartridge : List CartridgeType -> ChangeCartridgeMsg -> Cartridge -> Cartridge
updateCartridge cartridgeTypes msg cartridge =
    case msg of
        ChangeCartridgeName name ->
            { cartridge | name = name }

        ChangeCartridgeType type_ ->
            let
                newType =
                    LE.find (\ct -> ct.key == type_) cartridgeTypes |> Maybe.map .key |> Maybe.withDefault cartridge.cartridgeType
            in
            { cartridge | cartridgeType = newType }

        ChangeCartridgeTvMode tvMode ->
            { cartridge | tvMode = tvMode }

        ChangeCartridgeEmulatePaddles emulatePaddles ->
            { cartridge | emulatePaddles = emulatePaddles }

        ChangeCartridgeRngSeed seed ->
            let
                newSeed =
                    Maybe.andThen
                        (\x ->
                            if x >= 0 then
                                Just x

                            else
                                cartridge.rngSeed
                        )
                        seed
            in
            { cartridge | rngSeed = newSeed }

        ChangeCartridgeFirstVisibleLine line ->
            let
                newLine =
                    Maybe.andThen
                        (\x ->
                            if x >= 0 && x < 100 then
                                Just x

                            else
                                cartridge.firstVisibleLine
                        )
                        line
            in
            { cartridge | firstVisibleLine = newLine }

        ChangeCartridgeCpuEmulation emulation ->
            { cartridge | cpuEmulation = emulation }

        ChangeCartridgeAudioEmulation emulation ->
            { cartridge | audioEmulation = emulation }

        ChangeCartridgeVolume vol ->
            { cartridge | volume = vol }

        ChangePhosphorLevelPerCart level ->
            { cartridge | phosphorLevel = level }


updateSettings : ChangeSettingsMsg -> Settings -> Settings -> Settings
updateSettings msg defaultSettings settings =
    case msg of
        ChangeSettingsCpuEmulation cpuEmulation ->
            { settings | cpuEmulation = cpuEmulation }

        ChangeSettingsVolume volume ->
            { settings | volume = volume }

        ChangeSettingsAudioEmulation audioEmulation ->
            { settings | audioEmulation = audioEmulation }

        ChangeSettingsGammaCorrection gammaCorrection ->
            { settings | gammaCorrection = gammaCorrection }

        ChangeTvEmulation tvEmulation ->
            { settings | tvEmulation = tvEmulation }

        ChangeScaling scaling ->
            { settings | scaling = scaling }

        ChangePhosphorLevel level ->
            { settings | phosphorLevel = level }

        ChangeScanlineIntensity intensity ->
            { settings | scanlineIntensity = intensity }

        ChangeSettingsTouchControls touchControls ->
            { settings | touchControls = touchControls }

        ChangeSettingsLeftHanded leftHanded ->
            { settings | leftHanded = leftHanded }

        ChangeSettingsVirtualJoystickSensitivity sensitivity ->
            { settings | virtualJoystickSensitivity = sensitivity }

        ChangeSettingsUiMode uiMode ->
            { settings | uiMode = uiMode }

        ChangeSettingsUiSize size ->
            LE.find ((==) size) validUiSizes |> Maybe.map (\s -> { settings | uiSize = s }) |> Maybe.withDefault settings

        ChangeSettingsResetToDefault ->
            defaultSettings


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        noop x =
            ( x, Cmd.none )

        selectAndScrollToCart hash =
            ( { model | currentCartridgeHash = hash }
            , Maybe.map (Ports.scrollIntoView Ports.ScrollNearest) hash |> Maybe.withDefault Cmd.none
            )
    in
    case msg of
        NavigateToUrl url ->
            ( model, Nav.pushUrl model.key url )

        ChangeRoute route ->
            let
                scrollCmd =
                    case ( route, selectionInSearchResults model ) of
                        ( RouteCartridges, Just hash ) ->
                            if model.currentRoute /= RouteCartridges then
                                [ Ports.scrollIntoView Ports.ScrollCenter hash ]

                            else
                                []

                        _ ->
                            [ Ports.scrollToTop ]

                emulationCmd =
                    case ( route, model.emulationPaused ) of
                        ( RouteEmulation, False ) ->
                            [ Ports.resumeEmulation ]

                        _ ->
                            [ Ports.pauseEmulation ]

                newModel =
                    { model
                        | currentRoute = route
                        , sideMenu = False
                        , showMessageOnPause = route == RouteEmulation
                    }
            in
            ( newModel, Cmd.batch <| scrollCmd ++ emulationCmd )

        ChangeMedia media ->
            let
                cmd =
                    case ( model.currentRoute, selectionInSearchResults model ) of
                        ( RouteCartridges, Just hash ) ->
                            Ports.scrollIntoView Ports.ScrollCenter hash

                        _ ->
                            Cmd.none
            in
            ( { model | media = Just media, cartridgeViewMode = CartridgeViewCartridges }, cmd )

        ChangeCartridgeFilter cartridgeFilter ->
            let
                newModel =
                    { model | cartridgeFilter = cartridgeFilter }
            in
            ( newModel, Ports.scrollToTop )

        ClearCartridgeFilter ->
            let
                cmd =
                    case model.media of
                        Just MediaNarrow ->
                            Ports.scrollToTop

                        _ ->
                            model.currentCartridgeHash |> Maybe.map (Ports.scrollIntoView Ports.ScrollNearest) |> Maybe.withDefault Cmd.none
            in
            ( { model | cartridgeFilter = "" }, cmd )

        SelectCartridge hash ->
            selectAndScrollToCart <| Just hash

        SelectNextCartridgeMatchingSearch hash ->
            selectAndScrollToCart <| Maybe.map .hash <| nextCartridge (cartridgesMatchingSearch model) hash

        SelectPreviousCartridgeMatchingSearch hash ->
            selectAndScrollToCart <| Maybe.map .hash <| previousCartridge (cartridgesMatchingSearch model) hash

        SelectFirstCartridgeMatchingSearch ->
            selectAndScrollToCart <| Maybe.map .hash <| List.head <| cartridgesMatchingSearch model

        SelectLastCartridgeMatchingSearch ->
            selectAndScrollToCart <| Maybe.map .hash <| List.head <| List.reverse <| cartridgesMatchingSearch model

        ClearSelectedCartridge ->
            noop { model | currentCartridgeHash = Nothing }

        DeleteCartridge hash ->
            let
                selection =
                    if model.currentCartridgeHash == Just hash then
                        Maybe.map .hash <| nextCartridge (cartridgesMatchingSearch model) hash

                    else
                        model.currentCartridgeHash

                cmd =
                    if selection /= model.currentCartridgeHash then
                        Maybe.map (Ports.scrollIntoView Ports.ScrollNearest) selection |> Maybe.withDefault Cmd.none

                    else
                        Cmd.none
            in
            ( { model
                | cartridges =
                    List.filter (\c -> c.hash /= hash) model.cartridges
                , currentCartridgeHash = selection
                , cartridgeViewMode = CartridgeViewCartridges
              }
            , Cmd.batch [ cmd, Ports.deleteCartridge hash ]
            )

        DeleteAllCartridges ->
            ( { model | cartridges = [], currentCartridgeHash = Nothing }, Ports.deleteAllCartridges )

        ChangeCartridge hash msg_ ->
            let
                cartridgesNew =
                    List.map
                        (\c ->
                            if c.hash == hash then
                                updateCartridge model.cartridgeTypes msg_ c

                            else
                                c
                        )
                        model.cartridges

                cmd =
                    LE.find ((==) hash << .hash) cartridgesNew |> Maybe.map Ports.updateCartridge |> Maybe.withDefault Cmd.none
            in
            ( { model | cartridges = cartridgesNew }, cmd )

        SetHelpPage content ->
            noop { model | helppage = Just content }

        SetChangelog content ->
            noop { model | changelog = Just content }

        SetLicense content ->
            noop { model | license = Just content }

        ToggleSideMenu ->
            noop { model | sideMenu = not model.sideMenu }

        ChangeCartridgeViewMode mode ->
            let
                newViewMode =
                    case ( mode, model.currentCartridgeHash ) of
                        ( CartridgeViewSettings, Just _ ) ->
                            CartridgeViewSettings

                        _ ->
                            CartridgeViewCartridges

                cmd =
                    case ( newViewMode, model.cartridgeViewMode, selectionInSearchResults model ) of
                        ( CartridgeViewCartridges, CartridgeViewSettings, Just hash ) ->
                            Ports.scrollIntoView Ports.ScrollCenter hash

                        ( CartridgeViewSettings, CartridgeViewCartridges, _ ) ->
                            Ports.scrollToTop

                        _ ->
                            Cmd.none
            in
            ( { model | cartridgeViewMode = newViewMode }, cmd )

        AddCartridge ->
            ( model, Ports.addCartridge )

        AddNewCartridges cartridges ->
            let
                modelWithNewCartridges =
                    { model
                        | cartridges =
                            List.foldl (\c d -> Dict.insert c.hash c d) Dict.empty (model.cartridges ++ cartridges)
                                |> Dict.values
                        , cartridgeFilter = ""
                    }
            in
            case cartridges of
                hd :: _ ->
                    update (SelectCartridge hd.hash) modelWithNewCartridges

                _ ->
                    noop modelWithNewCartridges

        SaveCartridge hash ->
            ( model, Ports.saveCartridge hash )

        ChangeSettings changeSettingsMsg ->
            let
                newSettings =
                    updateSettings changeSettingsMsg model.defaultSettings model.settings

                mediaCommand =
                    if model.settings.uiSize /= newSettings.uiSize then
                        watchMediaCommand newSettings.uiSize

                    else
                        Cmd.none
            in
            ( { model | settings = newSettings }, Cmd.batch [ Ports.updateSettings newSettings, mediaCommand ] )

        MessageNeedsConfirmOrReject description buttonLabels message ->
            noop { model | messagePending = ( Just message, MessagePendingConfirmOrReject description buttonLabels ) }

        MessageNeedsAck description buttonLabel message ->
            noop { model | messagePending = ( Just message, MessagePendingAck description buttonLabel ) }

        RejectPendingMessage ->
            noop { model | messagePending = ( Nothing, Tuple.second model.messagePending ) }

        ConfirmPendingMessage ->
            let
                newModel =
                    { model | messagePending = ( Nothing, Tuple.second model.messagePending ) }
            in
            model.messagePending |> Tuple.first |> Maybe.map (\m -> update m newModel) |> Maybe.withDefault (noop newModel)

        StartEmulation hash ->
            ( { model | emulationPaused = False, runningCartridgeHash = Just hash, emulationState = EmulationStarting }
            , Cmd.batch
                [ Ports.startEmulation hash model.consoleSwitches
                , Nav.pushUrl model.key <| Routing.serializeRoute RouteEmulation
                ]
            )

        StopEmulation ->
            ( model, Ports.stopEmulation )

        PauseEmulation ->
            ( model, Ports.pauseEmulation )

        ResetEmulation ->
            ( model, Ports.resetEmulation )

        TogglePauseEmulation ->
            let
                emulationPaused =
                    not model.emulationPaused

                newModel =
                    { model | emulationPaused = emulationPaused, showMessageOnPause = False }

                cmd =
                    if emulationPaused then
                        Ports.pauseEmulation

                    else
                        Ports.resumeEmulation
            in
            case model.emulationState of
                EmulationPaused ->
                    ( newModel, cmd )

                EmulationRunning _ ->
                    ( newModel, cmd )

                _ ->
                    ( model, Cmd.none )

        UpdateEmulationState emulationState ->
            let
                newEmulationState =
                    case ( model.emulationState, emulationState ) of
                        ( EmulationStarting, EmulationStopped ) ->
                            EmulationStarting

                        _ ->
                            emulationState
            in
            noop { model | emulationState = newEmulationState }

        IncomingInputDriverEvent evt ->
            case evt of
                EventTogglePause ->
                    update TogglePauseEmulation model

                EventReset ->
                    ( model, Ports.resetEmulation )

                EventToggleFullscreen ->
                    ( model, Ports.toggleFullscreen )

        ChangeLimitFramerate limitFramerate ->
            ( { model | limitFramerate = limitFramerate }, Ports.setLimitFramerate limitFramerate )

        ChangeDifficultyP0 difficulty ->
            let
                switchesOld =
                    model.consoleSwitches

                consoleSwitches =
                    { switchesOld | difficultyP0 = difficulty }
            in
            ( { model | consoleSwitches = consoleSwitches }, Ports.updateConsoleSwitches consoleSwitches )

        ChangeDifficultyP1 difficulty ->
            let
                switchesOld =
                    model.consoleSwitches

                consoleSwitches =
                    { switchesOld | difficultyP1 = difficulty }
            in
            ( { model | consoleSwitches = consoleSwitches }, Ports.updateConsoleSwitches consoleSwitches )

        ChangeColorSwitch color ->
            let
                switchesOld =
                    model.consoleSwitches

                consoleSwitches =
                    { switchesOld | color = color }
            in
            ( { model | consoleSwitches = consoleSwitches }, Ports.updateConsoleSwitches consoleSwitches )

        BlurCurrentElement ->
            ( model, Ports.blurCurrentElement )

        NavigateToAboutPage ->
            ( model, Nav.pushUrl model.key <| Routing.serializeRoute RouteAbout )

        UpdateGamepadCount x ->
            ( { model | gamepadCount = x }, Cmd.none )

        None ->
            noop model
