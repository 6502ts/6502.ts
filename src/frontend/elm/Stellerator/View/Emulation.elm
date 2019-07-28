module Stellerator.View.Emulation exposing (page)

import Css exposing (..)
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Stellerator.Model exposing (Model, Msg)


page : Model -> List (Html Msg)
page _ =
    [ h1 []
        [ text "Emulation" ]
    , canvas
        [ A.css [ width (px 480), height (px 360) ]
        , A.id "stellerator-canvas"
        ]
        []
    ]
