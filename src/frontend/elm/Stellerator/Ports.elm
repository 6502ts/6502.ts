port module Stellerator.Ports exposing (ScrollPosition(..), mediaUpdate, scrollIntoView, watchMedia)

import Json.Encode as Encode



-- WatchMedia


port watchMedia_ : List String -> Cmd msg


watchMedia : List String -> Cmd msg
watchMedia =
    watchMedia_


port mediaUpdate_ : (List Bool -> msg) -> Sub msg


mediaUpdate : (List Bool -> msg) -> Sub msg
mediaUpdate =
    mediaUpdate_



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
