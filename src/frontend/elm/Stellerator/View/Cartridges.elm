module Stellerator.View.Cartridges exposing (page)

import Css exposing (..)
import Css.Global as Sel exposing (children, global, selector)
import Dos exposing (Color(..))
import Html.Styled as H exposing (..)
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
        , cartridgesMatchingSearch
        , nextCartridge
        , previousCartridge
        , selectionInSearchResults
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


ifHaveSelection : Model -> a -> a -> a
ifHaveSelection model a b =
    case model.currentCartridgeHash of
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


keyboardHandler : Model -> Int -> Msg
keyboardHandler model code =
    case code of
        38 ->
            Maybe.map SelectPreviousCartridgeMatchingSearch model.currentCartridgeHash
                |> Maybe.withDefault SelectLastCartridgeMatchingSearch

        40 ->
            Maybe.map SelectNextCartridgeMatchingSearch model.currentCartridgeHash
                |> Maybe.withDefault SelectFirstCartridgeMatchingSearch

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
            []
            [ btn [] [ text "Add new" ]
            , btn
                [ A.disabled <| ifHaveSelection model False True
                , E.onClick <| Maybe.withDefault None <| Maybe.map DeleteCartridge model.currentCartridgeHash
                ]
                [ text "Delete" ]
            , btn [] [ text "Run" ]
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
                    ]
                , E.onClick <| SelectCartridge cart.hash
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


searchInputNarrow : List Style -> Model -> Html Msg
searchInputNarrow styles model =
    label [ A.css <| [ displayFlex ] ++ styles, Dos.panel ]
        [ input
            [ A.type_ "text"
            , A.css [ flexGrow (int 1), Dos.marginRightCw 1 ]
            , A.placeholder "Search cartridges..."
            , A.value model.cartridgeFilter
            , Form.onChange ChangeCartridgeFilter
            ]
            []
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
            let
                ifSel =
                    ifCartSelected cart model.currentCartridgeHash
            in
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
                    ]
                , E.onClick <| SelectCartridge cart.hash
                ]
                [ text cart.name ]
    in
    let
        entrySel cart =
            let
                ifSel =
                    ifCartSelected cart model.currentCartridgeHash
            in
            let
                btn styles msg label =
                    Form.mobileButton [ A.type_ "button", A.css <| property "width" "calc(8 * var(--cw))" :: styles ] msg label
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
                    ]
                ]
                [ text cart.name
                , div [ A.css [ textAlign left, marginTop (Css.em 1), marginBottom (Css.em -0.5) ] ]
                    [ btn [] None "Edit"
                    , btn [ float right ] None "Run"
                    ]
                ]
    in
    let
        entry cart =
            ifCartSelected cart model.currentCartridgeHash entrySel entryUnsel <| cart
    in
    [ Keyed.node "div"
        [ A.css
            [ boxSizing borderBox
            , width (Css.vw 100)
            , paddingTop (Css.em 3.5)
            ]
        ]
      <|
        List.map (\c -> ( c.hash, entry c )) (cartridgesMatchingSearch model)
    ]


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


pageNarrow : Model -> List (Html Msg)
pageNarrow =
    cartridgeSubpageNarrow
