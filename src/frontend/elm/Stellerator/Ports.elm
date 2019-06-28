port module Stellerator.Ports exposing
    ( ScrollPosition(..)
    , addCartridge
    , onMediaUpdate
    , onNewCartridges
    , scrollIntoView
    , watchMedia
    )

import Json.Decode as Decode
import Json.Encode as Encode
import Stellerator.Model exposing (Cartridge, decodeCartridge)



-- WatchMedia


port watchMedia_ : List String -> Cmd msg


watchMedia : List String -> Cmd msg
watchMedia =
    watchMedia_


port onMediaUpdate_ : (List Bool -> msg) -> Sub msg


onMediaUpdate : (List Bool -> msg) -> Sub msg
onMediaUpdate =
    onMediaUpdate_



-- ScrollIntoView


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



-- AddCartridge


port addCartridge_ : () -> Cmd msg


addCartridge : Cmd msg
addCartridge =
    addCartridge_ ()


port onNewCartridges_ : (Decode.Value -> msg) -> Sub msg


onNewCartridges : (Maybe (List Cartridge) -> msg) -> Sub msg
onNewCartridges tagger =
    let
        decoder : Decode.Value -> Maybe (List Cartridge)
        decoder v =
            case Decode.decodeValue (Decode.list decodeCartridge) v of
                Ok x ->
                    Just x

                Err _ ->
                    Nothing
    in
    onNewCartridges_ <| tagger << decoder
