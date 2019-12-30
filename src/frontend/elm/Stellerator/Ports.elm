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


port module Stellerator.Ports exposing
    ( ScrollPosition(..)
    , addCartridge
    , blurCurrentElement
    , deleteAllCartridges
    , deleteCartridge
    , onEmulationStateChange
    , onInputDriverEvent
    , onMediaUpdate
    , onNewCartridges
    , pauseEmulation
    , resetEmulation
    , resumeEmulation
    , scrollIntoView
    , scrollToTop
    , setLimitFramerate
    , startEmulation
    , stopEmulation
    , toggleFullscreen
    , updateCartridge
    , updateConsoleSwitches
    , updateSettings
    , watchMedia
    )

import Json.Decode as Decode
import Json.Encode as Encode
import Stellerator.Model
    exposing
        ( Cartridge
        , ConsoleSwitches
        , EmulationState
        , InputDriverEvent
        , Msg(..)
        , Settings
        , decodeCartridge
        , decodeEmulationState
        , decodeInputDriverEvent
        , encodeCartridge
        , encodeConsoleSwitches
        , encodeSettings
        )



-- WatchMedia


port watchMedia_ : List String -> Cmd msg


watchMedia : List String -> Cmd msg
watchMedia =
    watchMedia_


port onMediaUpdate_ : (List Bool -> msg) -> Sub msg


onMediaUpdate : (List Bool -> msg) -> Sub msg
onMediaUpdate =
    onMediaUpdate_



-- DOM Handling


type ScrollPosition
    = Start
    | Center
    | End
    | Nearest


port scrollIntoView_ : ( String, String ) -> Cmd msg


scrollIntoView : ScrollPosition -> String -> Cmd msg
scrollIntoView scrollPosition id =
    let
        encodedScrollPosition =
            case scrollPosition of
                Start ->
                    "start"

                Center ->
                    "center"

                End ->
                    "end"

                Nearest ->
                    "nearest"
    in
    scrollIntoView_ ( encodedScrollPosition, id )


port scrollToTop_ : () -> Cmd msg


scrollToTop : Cmd msg
scrollToTop =
    scrollToTop_ ()


port blurCurrentElement_ : () -> Cmd msg


blurCurrentElement : Cmd msg
blurCurrentElement =
    blurCurrentElement_ ()



-- AddCartridge


port addCartridge_ : () -> Cmd msg


addCartridge : Cmd msg
addCartridge =
    addCartridge_ ()


port onNewCartridges_ : (Decode.Value -> msg) -> Sub msg


onNewCartridges : (List Cartridge -> msg) -> Sub msg
onNewCartridges tagger =
    let
        decoder : Decode.Value -> List Cartridge
        decoder v =
            case Decode.decodeValue (Decode.list decodeCartridge) v of
                Ok x ->
                    x

                Err _ ->
                    []
    in
    onNewCartridges_ <| tagger << decoder



-- UpdateCartridge


port updateCartridge_ : Encode.Value -> Cmd msg


updateCartridge : Cartridge -> Cmd msg
updateCartridge cart =
    encodeCartridge cart |> updateCartridge_



-- DeleteCartridge


port deleteCartridge_ : String -> Cmd msg


deleteCartridge : String -> Cmd msg
deleteCartridge =
    deleteCartridge_


port deleteAllCartridges_ : () -> Cmd msg


deleteAllCartridges : Cmd msg
deleteAllCartridges =
    deleteAllCartridges_ ()



-- UpdateSettings


port updateSettings_ : Encode.Value -> Cmd msg


updateSettings : Settings -> Cmd msg
updateSettings =
    encodeSettings >> updateSettings_



-- EmulationCommands


port startEmulation_ : Encode.Value -> Cmd msg


startEmulation : String -> ConsoleSwitches -> Cmd msg
startEmulation hash switches =
    [ ( "hash", Encode.string hash ), ( "switches", encodeConsoleSwitches switches ) ] |> Encode.object |> startEmulation_


port stopEmulation_ : () -> Cmd msg


stopEmulation : Cmd msg
stopEmulation =
    stopEmulation_ ()


port pauseEmulation_ : () -> Cmd msg


pauseEmulation : Cmd msg
pauseEmulation =
    pauseEmulation_ ()


port resumeEmulation_ : () -> Cmd msg


resumeEmulation : Cmd msg
resumeEmulation =
    resumeEmulation_ ()


port resetEmulation_ : () -> Cmd msg


resetEmulation : Cmd msg
resetEmulation =
    resetEmulation_ ()


port toggleFullscreen_ : () -> Cmd msg


toggleFullscreen : Cmd msg
toggleFullscreen =
    toggleFullscreen_ ()


port onInputDriverEvent_ : (Encode.Value -> msg) -> Sub msg


onInputDriverEvent : (InputDriverEvent -> Msg) -> Sub Msg
onInputDriverEvent tagger =
    onInputDriverEvent_ (Decode.decodeValue decodeInputDriverEvent >> Result.map tagger >> Result.withDefault None)


port onEmulationStateChange_ : (Encode.Value -> msg) -> Sub msg


onEmulationStateChange : (EmulationState -> Msg) -> Sub Msg
onEmulationStateChange tagger =
    onEmulationStateChange_ (Decode.decodeValue decodeEmulationState >> Result.map tagger >> Result.withDefault None)


port setLimitFramerate_ : Bool -> Cmd msg


setLimitFramerate : Bool -> Cmd msg
setLimitFramerate =
    setLimitFramerate_


port updateConsoleSwitches_ : Encode.Value -> Cmd msg


updateConsoleSwitches : ConsoleSwitches -> Cmd msg
updateConsoleSwitches =
    encodeConsoleSwitches >> updateConsoleSwitches_
