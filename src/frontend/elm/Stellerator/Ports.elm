port module Stellerator.Ports exposing (mediaUpdate, scrollIntoView, watchMedia)

-- WatchMedia


port watchMedia : List String -> Cmd msg


port mediaUpdate : (List Bool -> msg) -> Sub msg



-- ScrollIntoView


port scrollIntoView : String -> Cmd msg
