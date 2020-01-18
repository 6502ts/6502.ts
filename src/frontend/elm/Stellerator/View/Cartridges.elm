{-
   This file is part of 6502.ts, an emulator for 6502 based systems built
   in Typescript

   Copyright (c) 2014 -- 2020 Christian Speckner and contributors

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
-}


module Stellerator.View.Cartridges exposing (page)

import Css exposing (..)
import Css.Global as Sel exposing (children, global, selector)
import Dos exposing (Color(..))
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Html.Styled.Events as E
import Html.Styled.Keyed as Keyed
import Html.Styled.Lazy as Lazy
import Json.Decode as Decode
import List.Extra as LE
import Stellerator.Model
    exposing
        ( AudioEmulation(..)
        , Cartridge
        , CartridgeViewMode(..)
        , ChangeCartridgeMsg(..)
        , CpuEmulation(..)
        , Media(..)
        , Model
        , Msg(..)
        , TvMode(..)
        , cartridgesMatchingSearch
        , filterCartridgesBy
        , selectionInSearchResults
        )
import Stellerator.View.Form as Form



-- COMMON


onKeyDown : (( Bool, String ) -> Msg) -> Attribute Msg
onKeyDown tagger =
    let
        t m =
            case m of
                None ->
                    ( m, False )

                _ ->
                    ( m, True )
    in
    E.preventDefaultOn "keydown"
        (Decode.map2 Tuple.pair (Decode.field "ctrlKey" Decode.bool) (Decode.field "key" Decode.string)
            |> Decode.map tagger
            |> Decode.map t
        )


ifHaveSelection : Model -> a -> a -> a
ifHaveSelection model a b =
    case selectionInSearchResults model of
        Just _ ->
            a

        Nothing ->
            b


cartSelected : Cartridge -> Maybe String -> Bool
cartSelected cartridge hash =
    Maybe.map ((==) cartridge.hash) hash |> Maybe.withDefault False


ifCartSelected : Cartridge -> Maybe String -> a -> a -> a
ifCartSelected cartridge hash a b =
    if cartSelected cartridge hash then
        a

    else
        b


keyboardHandler : Model -> ( Bool, String ) -> Msg
keyboardHandler model code =
    case code of
        ( False, "ArrowUp" ) ->
            Maybe.map SelectPreviousCartridgeMatchingSearch model.currentCartridgeHash
                |> Maybe.withDefault SelectLastCartridgeMatchingSearch

        ( False, "ArrowDown" ) ->
            Maybe.map SelectNextCartridgeMatchingSearch model.currentCartridgeHash
                |> Maybe.withDefault SelectFirstCartridgeMatchingSearch

        ( True, "d" ) ->
            Maybe.map DeleteCartridge (selectionInSearchResults model) |> Maybe.withDefault None

        ( False, "Enter" ) ->
            Maybe.map StartEmulation (selectionInSearchResults model) |> Maybe.withDefault None

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

        checkbox lbl control =
            label [ A.css [ cursor pointer ] ]
                [ span [ A.css [ display inlineBlock, property "width" "calc(20 * var(--cw))" ] ] [ text lbl ]
                , control
                ]

        withLabel lbl control =
            label [ A.css [ display block, width (pct 100) ] ] [ text lbl, br [] [], control ]

        changeCartridge msg =
            msg >> ChangeCartridge cart.hash

        optionalNumberInput : (Maybe Int -> ChangeCartridgeMsg) -> Maybe Int -> Html Msg
        optionalNumberInput tagger value =
            Form.textInput
                [ A.type_ "text"
                , A.placeholder "Auto"
                , A.css [ property "width" "calc(10 * var(--cw))" ]
                , Form.onInput <|
                    \s ->
                        if s == "" then
                            changeCartridge tagger <| Nothing

                        else
                            Maybe.map (changeCartridge tagger << Just) (String.toInt s) |> Maybe.withDefault None
                ]
            <|
                Maybe.withDefault ""
                    << Maybe.map String.fromInt
                <|
                    value
    in
    [ withLabel "Cartridge name:" <|
        Form.textInput
            [ A.type_ "text"
            , A.css [ width (pct 100) ]
            , Form.onInput (changeCartridge ChangeCartridgeName)
            ]
            cart.name
    , withLabel "Cartridge type:" <|
        Form.picker
            (List.map (\t -> ( t.key, t.description )) model.cartridgeTypes)
            (changeCartridge ChangeCartridgeType)
            cart.cartridgeType
    , oneline "TV mode:" <|
        Form.radioGroup
            []
            [ ( TvPAL, "PAL" ), ( TvNTSC, "NTSC" ), ( TvSECAM, "SECAM" ) ]
            (changeCartridge ChangeCartridgeTvMode)
            cart.tvMode
    , checkbox "Emulate paddles:" <|
        Form.checkbox (changeCartridge ChangeCartridgeEmulatePaddles) cart.emulatePaddles
    , oneline "RNG seed:" <| optionalNumberInput ChangeCartridgeRngSeed cart.rngSeed
    , oneline "First visible line:" <| optionalNumberInput ChangeCartridgeFirstVisibleLine cart.firstVisibleLine
    , oneline "CPU emulation:" <|
        Form.radioGroup
            []
            [ ( Nothing, "Default" ), ( Just AccuracyInstruction, "Instruction" ), ( Just AccuracyCycle, "Cycle" ) ]
            (changeCartridge ChangeCartridgeCpuEmulation)
            cart.cpuEmulation
    , oneline "Audio emulation:" <|
        Form.radioGroup
            []
            [ ( Nothing, "Default" ), ( Just AudioPCM, "PCM" ), ( Just AudioWaveform, "Waveform" ) ]
            (changeCartridge ChangeCartridgeAudioEmulation)
            cart.audioEmulation
    , oneline "Phosphor emulation:" <|
        Form.radioGroup
            []
            [ ( Nothing, "Default" ), ( Just True, "On" ), ( Just False, "Off" ) ]
            (changeCartridge ChangeCartridgePhosphorEmulation)
            cart.phosphorEmulation
    , oneline "Volume:" <|
        let
            w =
                case model.media of
                    Just MediaNarrow ->
                        "calc(100vw - 10 * var(--cw))"

                    _ ->
                        "calc(40 * var(--cw))"
        in
        Form.slider
            [ property "width" w ]
            ( 0, 100 )
            (Maybe.map (changeCartridge ChangeCartridgeVolume) >> Maybe.withDefault None)
            (\x -> String.fromInt x ++ "%")
            cart.volume
    , div []
        [ button
            [ A.type_ "button"
            , E.onClick <| SaveCartridge cart.hash
            , A.css [ marginTop (Css.em 1), padding2 (px 0) (Css.em 1) ]
            ]
            [ text "Save cartridge image" ]
        ]
    ]


cartridgeListOrMessage : Model -> (String -> content) -> content -> content
cartridgeListOrMessage model message list =
    case List.map List.length [ model.cartridges, cartridgesMatchingSearch model ] of
        [ 0, _ ] ->
            message "start by clicking \"Add new\" to add a ROM image"

        [ _, 0 ] ->
            message "no cartridges match the search"

        _ ->
            list


page : Model -> Media -> List (Html Msg)
page model media =
    case media of
        MediaWide ->
            pageWide model

        MediaNarrow ->
            pageNarrow model



-- WIDE


cartridgeToolbarWide : Model -> Html Msg
cartridgeToolbarWide model =
    let
        searchInput =
            div [ A.css <| [ displayFlex ] ]
                [ Form.textInput
                    [ A.type_ "text"
                    , A.css [ flexGrow (int 1), Dos.marginRightCw 1 ]
                    , A.placeholder "Search cartridges..."
                    , Form.onInput ChangeCartridgeFilter
                    ]
                    model.cartridgeFilter
                , button
                    [ A.type_ "button"
                    , A.disabled <| model.cartridgeFilter == ""
                    , E.onClick ClearCartridgeFilter
                    ]
                    [ text "Clear" ]
                ]

        btn attr children =
            button
                ([ A.type_ "button"
                 , A.css [ property "width" "calc(10 * var(--cw))" ]
                 ]
                    ++ attr
                )
                children
    in
    form [ Dos.panel, E.onSubmit None ]
        [ searchInput
        , div
            []
            [ btn [ E.onClick AddCartridge ] [ text "Add new" ]
            , btn
                [ A.disabled <| ifHaveSelection model False True
                , E.onClick <| Maybe.withDefault None <| Maybe.map DeleteCartridge model.currentCartridgeHash
                ]
                [ text "Delete" ]
            , btn
                [ A.disabled <| ifHaveSelection model False True
                , selectionInSearchResults model |> Maybe.map StartEmulation |> Maybe.withDefault None |> E.onClick
                ]
                [ text "Run" ]
            ]
        ]


cartridgeListWide : Model -> Html Msg
cartridgeListWide model =
    let
        entry cart =
            let
                ifSel =
                    ifCartSelected cart model.currentCartridgeHash
            in
            div
                [ A.id cart.hash
                , A.css <|
                    [ nthChild "odd"
                        [ Dos.backgroundColor <| ifSel DarkGray Cyan
                        ]
                    , nthChild "even"
                        [ Dos.backgroundColor <| ifSel DarkGray LightGray
                        ]
                    , ifSel (Dos.color White) (Dos.color Black)
                    , property "padding-left" "var(--cw)"
                    , cursor pointer
                    , property "word-break" "break-word"
                    ]
                , E.onClick <| SelectCartridge cart.hash
                ]
                [ text <| " * " ++ cart.name ]

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

        list =
            Lazy.lazy2
                (\filter cartridges ->
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
                            (cartridges
                                |> filterCartridgesBy filter
                                |> List.sortBy (.name >> String.toUpper)
                                |> List.map
                                    (\c -> ( c.hash, entry c ))
                            )
                        ]
                )
                model.cartridgeFilter
                model.cartridges
    in
    cartridgeListOrMessage model message list


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
                , E.onSubmit None
                ]
                items
    in
    div
        [ Dos.panel
        , Dos.panelLabel "Settings:"
        , A.css <|
            [ displayFlex, overflowX hidden ]
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


searchInputNarrow : List Style -> Model -> Html Msg
searchInputNarrow styles model =
    label [ A.css <| [ displayFlex ] ++ styles, Dos.panel ]
        [ Form.textInput
            [ A.type_ "text"
            , A.css [ flexGrow (int 1), Dos.marginRightCw 1 ]
            , A.placeholder "Search cartridges..."
            , Form.onInput ChangeCartridgeFilter
            , Form.onChange (\_ -> BlurCurrentElement)
            ]
            model.cartridgeFilter
        , Form.mobileButton
            [ A.type_ "button"
            , A.disabled <| model.cartridgeFilter == ""
            , A.css [ marginBottom (Css.em 0.5) ]
            ]
            ClearCartridgeFilter
            "Clear"
        ]


cartridgeListNarrow : Model -> List (Html Msg)
cartridgeListNarrow model =
    let
        entryUnsel cart =
            div
                [ A.id cart.hash
                , A.css
                    [ boxSizing borderBox
                    , property "padding" "2.25em calc(2 * var(--cw))"
                    , minHeight (Css.em 5)
                    , textAlign center
                    , nthChild "odd" [ Dos.backgroundColor LightGray ]
                    , nthChild "even" [ Dos.backgroundColor Cyan ]
                    , Dos.color Black
                    , cursor pointer
                    , property "word-break" "break-word"
                    ]
                , E.onClick <| SelectCartridge cart.hash
                ]
                [ text cart.name ]

        entrySel cart =
            let
                btn msg label =
                    Form.mobileButton [ A.type_ "button", A.css [ property "width" "calc(8 * var(--cw))" ] ] msg label
            in
            div
                [ A.id cart.hash
                , Dos.panel
                , A.css
                    [ boxSizing borderBox
                    , minHeight (Css.em 4)
                    , textAlign center
                    , Dos.backgroundColor DarkGray
                    , Dos.color White
                    , cursor pointer
                    , property "word-break" "break-word"
                    ]
                ]
                [ text cart.name
                , div
                    [ A.css
                        [ displayFlex
                        , textAlign left
                        , marginTop (Css.em 1)
                        , marginBottom (Css.em -0.5)
                        , justifyContent spaceBetween
                        ]
                    ]
                    [ btn (ChangeCartridgeViewMode CartridgeViewSettings) "Edit"
                    , btn (selectionInSearchResults model |> Maybe.map StartEmulation |> Maybe.withDefault None) "Run"
                    ]
                ]

        entry cart =
            ifCartSelected cart model.currentCartridgeHash entrySel entryUnsel <| cart

        list =
            [ Lazy.lazy2
                (\filter cartridges ->
                    Keyed.node "div"
                        [ A.css
                            [ boxSizing borderBox
                            , width (Css.vw 100)
                            , marginTop (Css.em 3.5)
                            ]
                        ]
                    <|
                        List.map (\c -> ( c.hash, entry c )) (cartridges |> filterCartridgesBy filter |> List.sortBy (.name >> String.toUpper))
                )
                model.cartridgeFilter
                model.cartridges
            ]

        message msg =
            [ div
                [ A.css
                    [ width (vw 100)
                    , marginTop (Css.em 3.5)
                    , property "padding" "3em calc(2 * var(--cw)) 0 calc(2 * var(--cw))"
                    , textAlign center
                    , boxSizing borderBox
                    ]
                ]
                [ text msg ]
            ]
    in
    cartridgeListOrMessage model message list


addCartridgeButton : Html Msg
addCartridgeButton =
    button
        [ A.css
            [ textAlign center
            , position fixed
            , right (Css.em 0)
            , bottom (Css.em 0)
            , padding2 (Css.em 1) (Css.em 0.75)
            , Dos.backgroundColor LightBlue |> important
            , Dos.color LightGray
            , zIndex (int 10)
            , active [ Dos.backgroundColor Blue |> important ]
            ]
        , E.onClick AddCartridge
        ]
        [ text "─┼─" ]


cartridgeSubpageNarrow : Model -> List (Html Msg)
cartridgeSubpageNarrow model =
    searchInputNarrow
        [ width (vw 100)
        , position fixed
        , top (Css.em 2)
        , left (px 0)
        , boxSizing borderBox
        , zIndex (int 10)
        ]
        model
        :: addCartridgeButton
        :: global
            [ selector "body" [ paddingBottom (Css.em 5) ] ]
        :: cartridgeListNarrow model


settingsSubpageNarrow : Model -> Cartridge -> List (Html Msg)
settingsSubpageNarrow model cart =
    let
        btn msg label =
            Form.mobileButton [ A.type_ "button", A.css [ property "width" "calc(10 * var(--cw))" ] ] msg label

        settingsContainer items =
            form
                [ Dos.panel
                , Dos.panelLabel "Settings:"
                , E.onSubmit None
                , A.css
                    [ displayFlex
                    , flexDirection column
                    , alignItems flexStart
                    , children
                        [ Sel.label
                            [ pseudoClass "not(:first-of-type)" [ paddingTop (Css.em 1) ]
                            ]
                        ]
                    , marginTop (Css.em 4)
                    , paddingTop (Css.em 2)
                    ]
                ]
                items
    in
    [ form
        [ A.css
            [ paddingBottom (Css.em 0.5)
            , displayFlex
            , justifyContent spaceBetween
            , position fixed
            , top (Css.em 2)
            , left (px 0)
            , zIndex (int 10)
            , width (vw 100)
            , boxSizing borderBox
            ]
        , E.onSubmit None
        , Dos.panel
        ]
        [ btn (ChangeCartridgeViewMode CartridgeViewCartridges) "Back"
        , btn (DeleteCartridge cart.hash) "Delete"
        ]
    , settingsContainer <| settingsItems model cart
    ]


pageNarrow : Model -> List (Html Msg)
pageNarrow model =
    case ( model.cartridgeViewMode, Maybe.andThen (\h -> LE.find ((==) h << .hash) model.cartridges) model.currentCartridgeHash ) of
        ( CartridgeViewSettings, Just cart ) ->
            settingsSubpageNarrow model cart

        _ ->
            cartridgeSubpageNarrow model
