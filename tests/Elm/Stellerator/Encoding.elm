module Elm.Stellerator.Encoding exposing (suite)

import Expect
import Json.Decode as Decode
import Json.Encode as Encode
import Stellerator.Model
    exposing
        ( AudioEmulation(..)
        , Cartridge
        , CpuEmulation(..)
        , TvMode(..)
        , decodeAudioEmulation
        , decodeCartridge
        , decodeCpuEmulation
        , decodeTvMode
        , encodeAudioEmulation
        , encodeCartridge
        , encodeCpuEmulation
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
                , tvMode = PAL
                , emulatePaddles = False
                , volume = 66
                , rngSeed = Just 12366
                , firstVisibleLine = Just 28
                , cpuEmulation = Just Cycle
                , audioEmulation = Just PCM
                , phosphorEmulation = Just True
                }
          in
          roundTrip encodeCartridge decodeCartridge ( "Cartridge", cart )
        , describe "TvMode" <|
            List.map
                (roundTrip encodeTvMode decodeTvMode)
                [ ( "PAL", PAL ), ( "NTSC", NTSC ), ( "SECAM", SECAM ) ]
        , describe "AudioEmulation" <|
            List.map
                (roundTrip encodeAudioEmulation decodeAudioEmulation)
                [ ( "PCM", PCM ), ( "Waveform", Waveform ) ]
        , describe "CpuEmulation" <|
            List.map
                (roundTrip encodeCpuEmulation decodeCpuEmulation)
                [ ( "Instruction", Instruction ), ( "Cycle", Cycle ) ]
        ]
