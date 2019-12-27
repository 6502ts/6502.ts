module Stellerator.Media exposing (watchMediaCommand, watchMediaSubscription)

import Stellerator.Model exposing (Media(..), Msg(..))
import Stellerator.Ports as Ports


watchMediaCommand : Int -> Cmd msg
watchMediaCommand uiSize =
    let
        breakpoint =
            (750 * uiSize) // 100
    in
    Ports.watchMedia [ "(max-width: " ++ String.fromInt breakpoint ++ "px)" ]


watchMediaSubscription : Sub Msg
watchMediaSubscription =
    List.head
        >> Maybe.map
            (\x ->
                ChangeMedia <|
                    if x then
                        MediaNarrow

                    else
                        MediaWide
            )
        >> Maybe.withDefault None
        |> Ports.onMediaUpdate
