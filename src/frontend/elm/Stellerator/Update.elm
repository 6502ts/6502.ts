module Stellerator.Update exposing (update)

import Browser.Navigation as Nav
import List.Extra as LE
import Stellerator.Model exposing (..)
import Stellerator.Ports as Ports


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
            { cartridge | rngSeed = seed }

        ChangeCartridgeFirstVisibleLine line ->
            { cartridge | firstVisibleLine = line }

        ChangeCartridgeCpuEmulation emulation ->
            { cartridge | cpuEmulation = emulation }

        ChangeCartridgeAudioEmulation emulation ->
            { cartridge | audioEmulation = emulation }

        ChangeCartridgeVolume vol ->
            { cartridge | volume = vol }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        noop x =
            ( x, Cmd.none )
    in
    let
        selectAndScrollToCart hash =
            ( { model | currentCartridgeHash = hash }
            , Maybe.map (Ports.scrollIntoView Ports.Nearest) hash |> Maybe.withDefault Cmd.none
            )
    in
    let
        dummyEmulationState route =
            case route of
                Cartridges ->
                    Stopped

                Settings ->
                    Paused

                Emulation ->
                    Running (Just 3.55)

                Help ->
                    Running Nothing
    in
    case msg of
        NavigateToUrl url ->
            ( model, Nav.pushUrl model.key url )

        ChangeRoute route ->
            let
                cmd =
                    case ( route, selectionInSearchResults model ) of
                        ( Cartridges, Just hash ) ->
                            if model.currentRoute /= Cartridges then
                                Ports.scrollIntoView Ports.Center hash

                            else
                                Cmd.none

                        _ ->
                            Cmd.none
            in
            let
                newModel =
                    { model
                        | currentRoute = route
                        , emulationState = dummyEmulationState route
                        , sideMenu = False
                    }
            in
            ( newModel, cmd )

        ChangeMedia media ->
            noop { model | media = media }

        ChangeCartridgeFilter cartridgeFilter ->
            let
                newModel =
                    { model | cartridgeFilter = cartridgeFilter }
            in
            let
                cmd =
                    selectionInSearchResults newModel |> Maybe.map (Ports.scrollIntoView Ports.Nearest) |> Maybe.withDefault Cmd.none
            in
            ( newModel, cmd )

        ClearCartridgeFilter ->
            let
                cmd =
                    model.currentCartridgeHash |> Maybe.map (Ports.scrollIntoView Ports.Nearest) |> Maybe.withDefault Cmd.none
            in
            ( { model | cartridgeFilter = "" }, cmd )

        SelectCartridge hash ->
            noop { model | currentCartridgeHash = Just hash }

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
            in
            let
                cmd =
                    if selection /= model.currentCartridgeHash then
                        Maybe.map (Ports.scrollIntoView Ports.Nearest) selection |> Maybe.withDefault Cmd.none

                    else
                        Cmd.none
            in
            ( { model
                | cartridges =
                    List.filter (\c -> c.hash /= hash) model.cartridges
                , currentCartridgeHash = selection
              }
            , cmd
            )

        ChangeCartridge hash msg_ ->
            noop
                { model
                    | cartridges =
                        List.map
                            (\c ->
                                if c.hash == hash then
                                    updateCartridge model.cartridgeTypes msg_ c

                                else
                                    c
                            )
                            model.cartridges
                }

        SetHelpPage content ->
            noop { model | helppage = Just content }

        ToggleSideMenu ->
            noop { model | sideMenu = not model.sideMenu }

        _ ->
            noop model
