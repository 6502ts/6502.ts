module Stellerator.View.Cartridges exposing (page)

import Html.Styled exposing (..)
import Stellerator.Model exposing (Model, Msg)


page : Model -> List (Html Msg)
page model =
    [ h1 [] [ text "Cartridges" ]
    , ul [] <| List.map (\c -> li [] [ text c.name ]) model.cartridges
    , h1 [] [ text "Cartridge types" ]
    , ul [] <| List.map (\ct -> li [] [ text ct.description ]) model.cartridgeTypes
    ]
