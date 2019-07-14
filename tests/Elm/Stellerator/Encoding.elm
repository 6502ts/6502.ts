module Elm.Stellerator.Encoding exposing (suite)

import Expect
import Json.Decode as Decode
import Json.Encode as Encode
import Stellerator.Model
    exposing
        ( AudioEmulation(..)
        , Cartridge
        , CpuEmulation(..)
        , Media(..)
        , Settings
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
                , phosphorEmulation = Just True
                }
          in
          roundTrip encodeCartridge decodeCartridge ( "Cartridge", cart )
        , let
            settings : Settings
            settings =
                { cpuEmulation = AccuracyCycle
                , volume = 80
                , audioEmulation = AudioPCM
                , smoothScaling = True
                , phosphorEmulation = True
                , gammaCorrection = 2.3
                , videoSync = True
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
