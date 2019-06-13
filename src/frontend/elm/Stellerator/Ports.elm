port module Stellerator.Ports exposing (mediaUpdate, watchMedia)

import Stellerator.Model exposing (..)



-- WatchMedia


port watchMedia : List String -> Cmd msg


port mediaUpdate : (List Bool -> msg) -> Sub msg
