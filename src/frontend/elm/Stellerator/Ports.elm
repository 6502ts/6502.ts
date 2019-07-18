port module Stellerator.Ports exposing
    ( ScrollPosition(..)
    , addCartridge
    , deleteAllCartridges
    , deleteCartridge
    , onMediaUpdate
    , onNewCartridges
    , scrollIntoView
    , updateCartridge
    , updateSettings
    , watchMedia
    )

import Json.Decode as Decode
import Json.Encode as Encode
import Stellerator.Model
    exposing
        ( Cartridge
        , Settings
        , decodeCartridge
        , encodeCartridge
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
