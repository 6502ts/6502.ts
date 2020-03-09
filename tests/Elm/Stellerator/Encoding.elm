module Elm.Stellerator.Encoding exposing (suite)

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

import Expect
import Json.Decode as Decode
import Json.Encode as Encode
import Stellerator.Model
    exposing
        ( AudioEmulation(..)
        , Cartridge
        , CpuEmulation(..)
        , Media(..)
        , Scaling(..)
        , Settings
        , TvEmulation(..)
        , TvMode(..)
        , decodeAudioEmulation
        , decodeCartridge
        , decodeCpuEmulation
        , decodeMedia
        , decodeSettings
        , decodeTvMode
        , encodeAudioEmulation
        , encodeCartridge
        , encodeCpuEmulation
        , encodeMedia
        , encodeSettings
        , encodeTvMode
        )
import Test exposing (..)


suite : Test
suite =
    describe "Encoding and decoding" <|
        let
            roundTrip encoder decoder ( desc, value ) =
                test desc <| \_ -> value |> encoder |> Encode.encode 0 |> Decode.decodeString decoder |> Expect.equal (Ok value)
        in
        [ let
            cart : Cartridge
            cart =
                { hash = "abc"
                , name = "somecart"
                , cartridgeType = "CDF"
                , tvMode = TvPAL
                , emulatePaddles = False
                , volume = 66
                , rngSeed = Just 12366
                , firstVisibleLine = Just 28
                , cpuEmulation = Just AccuracyCycle
                , audioEmulation = Just AudioPCM
                , phosphorLevel = Just 44
                }
          in
          roundTrip encodeCartridge decodeCartridge ( "Cartridge", cart )
        , let
            settings : Settings
            settings =
                { cpuEmulation = AccuracyCycle
                , volume = 80
                , audioEmulation = AudioPCM
                , gammaCorrection = 2.3
                , tvEmulation = TvEmulationComposite
                , scaling = ScalingQis
                , phosphorLevel = 33
                , scanlineIntensity = 77
                , touchControls = Maybe.Just True
                , leftHanded = False
                , virtualJoystickSensitivity = 10
                , uiMode = Maybe.Just MediaNarrow
                , uiSize = 22
                }
          in
          roundTrip encodeSettings decodeSettings ( "Settings", settings )
        , describe "TvMode" <|
            List.map
                (roundTrip encodeTvMode decodeTvMode)
                [ ( "PAL", TvPAL ), ( "NTSC", TvNTSC ), ( "SECAM", TvSECAM ) ]
        , describe "AudioEmulation" <|
            List.map
                (roundTrip encodeAudioEmulation decodeAudioEmulation)
                [ ( "PCM", AudioPCM ), ( "Waveform", AudioWaveform ) ]
        , describe "CpuEmulation" <|
            List.map
                (roundTrip encodeCpuEmulation decodeCpuEmulation)
                [ ( "Instruction", AccuracyInstruction ), ( "Cycle", AccuracyCycle ) ]
        , describe "Media" <|
            List.map
                (roundTrip encodeMedia decodeMedia)
                [ ( "Narrow", MediaNarrow ), ( "Wide", MediaWide ) ]
        ]
