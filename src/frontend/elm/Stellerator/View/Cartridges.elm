module Stellerator.View.Cartridges exposing (page)

import Css exposing (..)
import Css.Global as Sel exposing (children)
import Dos exposing (Color(..))
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Html.Styled.Events as E
import Html.Styled.Keyed as Keyed
import Json.Decode as Decode
import List.Extra as LE
import Stellerator.Model
    exposing
        ( AudioEmulation(..)
        , Cartridge
        , ChangeCartridgeMsg(..)
        , CpuEmulation(..)
        , Media(..)
        , Model
        , Msg(..)
        , TvMode(..)
        )
import Stellerator.View.Form as Form



-- COMMON


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
    E.preventDefaultOn "keydown" (Decode.map t <| Decode.map tagger E.keyCode)


cartridgesMatchingSearch : Model -> List Cartridge
cartridgesMatchingSearch model =
    let
        filterWords =
            model.cartridgeFilter |> String.toUpper |> String.words
    in
    List.filter
        (\c -> List.all (\w -> String.contains w <| String.toUpper c.name) filterWords)
        model.cartridges


haveSelection : Model -> Bool
haveSelection model =
    Maybe.map
        (\h -> List.any (\c -> c.hash == h) <| cartridgesMatchingSearch model)
        model.currentCartridgeHash
        |> Maybe.withDefault False


ifHaveSelection : Model -> a -> a -> a
ifHaveSelection model a b =
    if haveSelection model then
        a

    else
        b


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


settingsItems : Model -> Cartridge -> List (Html Msg)
settingsItems model cart =
    let
        oneline lbl control =
            label [ A.for "nothing" ]
                [ span [ A.css [ display inlineBlock, property "width" "calc(20 * var(--cw))" ] ] [ text lbl ]
                , control
                ]
    in
    let
        checkbox lbl control =
            label [ A.css [ cursor pointer ] ]
                [ span [ A.css [ display inlineBlock, property "width" "calc(20 * var(--cw))" ] ] [ text lbl ]
                , control
                ]
    in
    let
        changeCartridge msg =
            msg >> ChangeCartridge cart.hash
    in
    let
        optionalNumberInput tagger value =
            input
                [ A.type_ "text"
                , A.placeholder "Auto"
                , A.css [ property "width" "calc(10 * var(--cw))" ]
                , A.value <| Maybe.withDefault "" << Maybe.map String.fromInt <| value
                , Form.onInput <|
                    \s ->
                        if s == "" then
                            changeCartridge tagger <| Nothing

                        else
                            case String.toInt s of
                                Just x ->
                                    if x >= 0 then
                                        changeCartridge tagger <| Just x

                                    else
                                        None

                                Nothing ->
                                    None
                ]
                []
    in
    [ label [] [ text "Cartridge name:" ]
    , input
        [ A.type_ "text"
        , A.value cart.name
        , A.css [ width (pct 100) ]
        , Form.onInput (changeCartridge ChangeCartridgeName)
        ]
        []
    , label [] [ text "Cartridge type:" ]
    , Form.picker
        (List.map (\t -> ( t.key, t.description )) model.cartridgeTypes)
        (changeCartridge ChangeCartridgeType)
        cart.cartridgeType
    , oneline "TV mode:" <|
        Form.radioGroup
            []
            [ ( PAL, "PAL" ), ( NTSC, "NTSC" ), ( SECAM, "SECAM" ) ]
            (changeCartridge ChangeCartridgeTvMode)
            cart.tvMode
    , checkbox "Emulate paddles:" <|
        input
            [ A.type_ "checkbox"
            , Form.onCheckChange (changeCartridge ChangeCartridgeEmulatePaddles)
            , A.checked cart.emulatePaddles
            ]
            []
    , oneline "RNG seed:" <| optionalNumberInput ChangeCartridgeRngSeed cart.rngSeed
    , oneline "First visible line:" <| optionalNumberInput ChangeCartridgeFirstVisibleLine cart.firstVisibleLine
    , oneline "CPU Emulation:" <|
        Form.radioGroup
            []
            [ ( Nothing, "Default" ), ( Just Instruction, "Instruction" ), ( Just Cycle, "Cycle" ) ]
            (changeCartridge ChangeCartridgeCpuEmulation)
            cart.cpuEmulation
    , oneline "Audio Emulation:" <|
        Form.radioGroup
            []
            [ ( Nothing, "Default" ), ( Just PCM, "PCM" ), ( Just Waveform, "Waveform" ) ]
            (changeCartridge ChangeCartridgeAudioEmulation)
            cart.audioEmulation
    , oneline "Volume:" <|
        span []
            [ input
                [ A.css [ property "width" "calc(30 * var(--cw))", Dos.marginRightCw 2 ]
                , A.type_ "range"
                , A.min "0"
                , A.max "100"
                , A.value <| String.fromInt cart.volume
                , Form.onInput <|
                    String.toInt
                        >> Maybe.map
                            (\x ->
                                if x >= 0 && x <= 100 then
                                    changeCartridge ChangeCartridgeVolume <| x

                                else
                                    None
                            )
                        >> Maybe.withDefault None
                ]
                []
            , text <| String.fromInt cart.volume ++ "%"
            ]
    ]


page : Model -> List (Html Msg)
page model =
    case model.media of
        Wide ->
            pageWide model

        Narrow ->
            pageNarrow model



-- WIDE


cartridgeToolbarWide : Model -> Html Msg
cartridgeToolbarWide model =
    let
        searchInput =
            div [ A.css <| [ displayFlex ] ]
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
    in
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
    form [ Dos.panel ]
        [ searchInput
        , div
            [ A.css [ position relative ] ]
            [ btn [] [ text "Add new" ]
            , btn [ A.disabled <| not <| haveSelection model, E.onClick DeleteCurrentCartridge ] [ text "Delete" ]
            , btn [] [ text "Run" ]
            ]
        ]


cartridgeListWide : Model -> Html Msg
cartridgeListWide model =
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
                [ A.id cart.hash
                , A.css <|
                    [ nthChild "odd"
                        [ Dos.backgroundColor <| ifSelected DarkGray Cyan
                        ]
                    , nthChild "even"
                        [ Dos.backgroundColor <| ifSelected DarkGray LightGray
                        ]
                    , ifSelected (Dos.color White) (Dos.color Black)
                    , property "padding-left" "var(--cw)"
                    , cursor pointer
                    ]
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
                    ]
                ]
                [ text msg ]
    in
    let
        list =
            div
                [ Dos.panel
                , A.css
                    [ displayFlex
                    , flexGrow (int 1)
                    , alignItems stretch
                    , overflowY hidden
                    ]
                ]
                [ Keyed.node "div"
                    [ A.css
                        [ flexGrow (int 1)
                        , overflowY scroll
                        , property "-webkit-overflow-scrolling" "touch"
                        ]
                    ]
                  <|
                    List.map
                        (\c -> ( c.hash, entry c ))
                        (cartridgesMatchingSearch model)
                ]
    in
    case List.map List.length [ model.cartridges, cartridgesMatchingSearch model ] of
        [ 0, _ ] ->
            message "start by clicking \"Add new\" to add a ROM image"

        [ _, 0 ] ->
            message "no cartridges match the search"

        _ ->
            list


settingsWide : Model -> List Style -> Html Msg
settingsWide model styles =
    let
        formContainer items =
            form
                [ A.css
                    [ displayFlex
                    , flexDirection column
                    , alignItems flexStart
                    , paddingTop (Css.em 1)
                    , overflowY scroll
                    , property "-webkit-overflow-scrolling" "touch"
                    , flexGrow (int 1)
                    , children [ Sel.label [ pseudoClass "not(:first-of-type)" [ paddingTop (Css.em 1) ] ] ]
                    ]
                ]
                items
    in
    div
        [ Dos.panel
        , Dos.panelLabel "Settings:"
        , A.css <|
            [ displayFlex ]
                ++ ifHaveSelection model [ alignItems stretch ] [ alignItems center, justifyContent center ]
                ++ styles
        ]
    <|
        [ Maybe.andThen (\h -> LE.find (\c -> h == c.hash) <| cartridgesMatchingSearch model) model.currentCartridgeHash
            |> Maybe.map (formContainer << settingsItems model)
            |> Maybe.withDefault (text "no cartridge selected")
        ]


pageWide : Model -> List (Html Msg)
pageWide model =
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
            ]
            [ cartridgeToolbarWide model
            , cartridgeListWide
                model
            ]
        , settingsWide model [ boxSizing borderBox, flexGrow (int 1), flexBasis (px 0) ]
        ]
    ]



-- NARROW


searchInputNarrow : Model -> Html Msg
searchInputNarrow model =
    form [ A.css <| [ displayFlex, flexShrink (int 0) ], Dos.panel ]
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


cartridgeListNarrow : Model -> Html Msg
cartridgeListNarrow model =
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
                    , ifSelected (Dos.color White) (Dos.color Black)
                    , property "padding-left" "var(--cw)"
                    , cursor pointer
                    , textAlign center
                    , paddingTop (Css.em 1)
                    , paddingBottom (Css.em 1)
                    , textOverflow ellipsis
                    ]
                , E.onClick <| SelectCurrentCartridge cart.hash
                ]
                [ text cart.name ]
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
                    ]
                ]
                [ text msg ]
    in
    let
        list =
            div
                [ A.css
                    [ displayFlex
                    , flexGrow (int 1)
                    , alignItems stretch
                    , overflowY hidden
                    ]
                , Dos.panel
                ]
                [ Keyed.node "div"
                    [ A.css
                        [ flexGrow (int 1)
                        , overflowY scroll
                        , property "-webkit-overflow-scrolling" "touch"
                        ]
                    ]
                  <|
                    List.map
                        (\c -> ( c.hash, entry c ))
                        (cartridgesMatchingSearch model)
                ]
    in
    case List.map List.length [ model.cartridges, cartridgesMatchingSearch model ] of
        [ 0, _ ] ->
            message "start by clicking \"Add new\" to add a ROM image"

        [ _, 0 ] ->
            message "no cartridges match the search"

        _ ->
            list


cartridgeSubpageNarrow : Model -> Html Msg
cartridgeSubpageNarrow model =
    div
        [ A.css
            [ position absolute
            , top (Css.em 2)
            , left (px 0)
            , width (vw 100)
            , property "height" "calc(100vh - 2em)"
            , displayFlex
            , alignItems stretch
            , flexDirection column
            ]
        ]
        [ searchInputNarrow model
        , cartridgeListNarrow model
        ]


pageNarrow : Model -> List (Html Msg)
pageNarrow model =
    [ cartridgeSubpageNarrow model ]
