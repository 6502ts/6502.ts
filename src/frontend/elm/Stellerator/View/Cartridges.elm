module Stellerator.View.Cartridges exposing (page)

import Css exposing (..)
import Css.Global as Sel exposing (children)
import Dos exposing (Color(..))
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Html.Styled.Events as E
import Html.Styled.Keyed as Keyed
import Json.Decode as Json
import List.Extra as LE
import Stellerator.Model exposing (Cartridge, ChangeCartridgeMsg(..), Model, Msg(..))
import Stellerator.View.Form as Form


onKeyDown : (Int -> Msg) -> Attribute Msg
onKeyDown tagger =
    let
        t m =
            case m of
                None ->
                    ( m, False )

                _ ->
                    ( m, True )
    in
    E.preventDefaultOn "keydown" (Json.map t <| Json.map tagger E.keyCode)


cartridgesMatchingSearch : Model -> List Cartridge
cartridgesMatchingSearch model =
    let
        filterWords =
            model.cartridgeFilter |> String.toUpper |> String.words
    in
    List.filter
        (\c -> List.all (\w -> String.contains w <| String.toUpper c.name) filterWords)
        model.cartridges


keyboardHandler : Model -> Int -> Msg
keyboardHandler model code =
    let
        matchingCartridges =
            cartridgesMatchingSearch model
    in
    let
        selectFirst =
            matchingCartridges |> List.head |> Maybe.map (SelectCurrentCartridge << .hash) |> Maybe.withDefault None
    in
    let
        selectLast =
            matchingCartridges |> List.reverse |> List.head |> Maybe.map (SelectCurrentCartridge << .hash) |> Maybe.withDefault None
    in
    let
        next hash =
            let
                next_ l =
                    case l of
                        h1 :: h2 :: tail ->
                            if h1 == hash then
                                SelectCurrentCartridge h2

                            else
                                next_ (h2 :: tail)

                        _ ->
                            selectFirst
            in
            let
                hashes =
                    List.map .hash <| matchingCartridges
            in
            next_ <| hashes ++ hashes ++ hashes
    in
    let
        previous hash =
            let
                previous_ l =
                    case l of
                        h1 :: h2 :: tail ->
                            if h2 == hash then
                                SelectCurrentCartridge h1

                            else
                                previous_ (h2 :: tail)

                        _ ->
                            selectLast
            in
            let
                hashes =
                    List.map .hash <| matchingCartridges
            in
            previous_ <| hashes ++ hashes ++ hashes
    in
    case code of
        38 ->
            Maybe.map previous model.currentCartridgeHash |> Maybe.withDefault selectLast

        40 ->
            Maybe.map next model.currentCartridgeHash |> Maybe.withDefault selectFirst

        _ ->
            None


cartridgeToolbar : Model -> Html Msg
cartridgeToolbar model =
    let
        btn attr children =
            button
                ([ A.type_ "button"
                 , A.css [ property "width" "calc(10 * var(--cw))" ]
                 ]
                    ++ attr
                )
                children
    in
    let
        hasSelection =
            Maybe.map
                (\h -> List.any (\c -> c.hash == h) <| cartridgesMatchingSearch model)
                model.currentCartridgeHash
                |> Maybe.withDefault False
    in
    form [ Dos.panel, A.css [ displayFlex, flexDirection column ] ]
        [ div [ A.css [ displayFlex ] ]
            [ input
                [ A.type_ "text"
                , A.css [ flexGrow (int 1), Dos.marginRightCw 1 ]
                , A.placeholder "Search cartridges..."
                , A.value model.cartridgeFilter
                , Form.onInput ChangeCartridgeFilter
                ]
                []
            , button
                [ A.type_ "button"
                , A.disabled <| model.cartridgeFilter == ""
                , E.onClick ClearCartridgeFilter
                ]
                [ text "Clear" ]
            ]
        , div
            [ A.css [ position relative ] ]
            [ btn [] [ text "Add new" ]
            , btn [ A.disabled <| not hasSelection, E.onClick DeleteCurrentCartridge ] [ text "Delete" ]
            , btn [] [ text "Run" ]
            ]
        ]


cartridgeList : Model -> Html Msg
cartridgeList model =
    let
        entry cart =
            let
                selected =
                    Maybe.map (\s -> s == cart.hash) model.currentCartridgeHash |> Maybe.withDefault False
            in
            let
                ifSelected x y =
                    if selected then
                        x

                    else
                        y
            in
            div
                [ A.css <|
                    [ nthChild "odd"
                        [ Dos.backgroundColor <| ifSelected DarkGray Cyan
                        ]
                    , nthChild "even"
                        [ Dos.backgroundColor <| ifSelected DarkGray LightGray
                        ]
                    , Dos.color Black
                    , property "padding-left" "var(--cw)"
                    , cursor pointer
                    ]
                        ++ ifSelected [ Dos.color White ] []
                , E.onClick <| SelectCurrentCartridge cart.hash
                ]
                [ text <| " * " ++ cart.name ]
    in
    let
        message msg =
            div
                [ Dos.panel
                , A.css
                    [ flexGrow (int 1)
                    , displayFlex
                    , flexDirection column
                    , textAlign center
                    , justifyContent center
                    , overflow hidden
                    ]
                ]
                [ text msg ]
    in
    case List.map List.length [ model.cartridges, cartridgesMatchingSearch model ] of
        [ 0, _ ] ->
            message "start by clicking \"Add new\" to add a ROM image"

        [ _, 0 ] ->
            message "no cartridges match the search"

        _ ->
            Keyed.node "div"
                [ Dos.panel
                , A.css [ flexGrow (int 1) ]
                ]
            <|
                List.map
                    (\c -> ( c.hash, entry c ))
                    (cartridgesMatchingSearch model)


settings : Model -> List Style -> Html Msg
settings model styles =
    let
        formItems cart =
            let
                changeCartridge msg =
                    msg >> ChangeCartridge cart.hash
            in
            [ label [] [ text "Cartridge name:" ]
            , input
                [ A.type_ "text"
                , A.value cart.name
                , Form.onInput (changeCartridge ChangeCartridgeName)
                ]
                []
            , label [] [ text "Cartridge type:" ]
            , Form.picker
                (List.map (\t -> ( t.key, t.description )) model.cartridgeTypes)
                cart.cartridgeType
                (changeCartridge ChangeCartridgeType)
            ]
    in
    let
        ifHaveSelection a b =
            Maybe.map (\_ -> a) model.currentCartridgeHash |> Maybe.withDefault b
    in
    form
        [ Dos.panel
        , Dos.panelLabel "Settings:"
        , A.css <|
            [ displayFlex
            , flexDirection column
            , alignItems stretch
            , paddingTop (Css.em 2)
            , children [ Sel.label [ pseudoClass "not(:first-of-type)" [ paddingTop (Css.em 1) ] ] ]
            ]
                ++ ifHaveSelection [ alignItems stretch ] [ alignItems center, justifyContent center ]
                ++ styles
        ]
    <|
        (Maybe.andThen (\h -> LE.find (\c -> h == c.hash) model.cartridges) model.currentCartridgeHash
            |> Maybe.map formItems
            |> Maybe.withDefault [ text "no cartridge selected" ]
        )


page : Model -> List (Html Msg)
page model =
    [ div
        [ A.css
            [ height <| calc (vh 100) minus (Css.em 2)
            , displayFlex
            , alignItems stretch
            , paddingTop (Css.em 1)
            , boxSizing borderBox
            , borderStyle none |> important
            , outlineStyle none |> important
            ]
        , A.tabindex 0
        , onKeyDown <| keyboardHandler model
        ]
        [ div
            [ A.css
                [ boxSizing borderBox
                , flexGrow (int 1)
                , flexBasis (px 0)
                , displayFlex
                , flexDirection column
                ]
            , onKeyDown <| keyboardHandler model
            ]
            [ cartridgeToolbar model
            , cartridgeList
                model
            ]
        , settings model [ boxSizing borderBox, flexGrow (int 1), flexBasis (px 0) ]
        ]
    ]
