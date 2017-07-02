/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as React from 'react';

import {ControlLabel} from 'react-bootstrap';

import StellaConfig from '../../../../../machine/stella/Config';
import CartridgeInfo from '../../../../../machine/stella/cartridge/CartridgeInfo';

import {styled, StyledComponent} from '../style';
import CartridgeNameInput from './CartridgeNameInput';
import TvModeSelect from './TvModeSelect';
import CartridgeTypeSelect from './CartridgeTypeSelect';
import Switch from '../general/Switch';
import RandomSeedEdit from './RandomSeedEdit';
import Cartridge from '../../model/Cartridge';

export interface Props {
    cartridge: Cartridge;
    className?: string;

    onCartridgeNameChange?: (value: string) => void;
    onSave?: () => void;
    onTvModeChanged?: (tvMode: StellaConfig.TvMode) => void;
    onTogglePaddleEmulation?: (state: boolean) => void;
    onToggleAudioEnabled?: (state: boolean) => void;
    onCartridgeTypeChange?: (t: CartridgeInfo.CartridgeType) => void;
    onChangeSeedStrategy?: (auto: boolean) => void;
    onChangeSeedValue?: (seed: number) => void;
}

function CartridgeSettingsUnstyled(props: Props) {
    if (!props.cartridge) {
        return null;
    }

    return <div className={props.className}>
        <LabelStyled>Name:</LabelStyled>
        <CartridgeNameInput
            name={props.cartridge.name}
            onNameChange={props.onCartridgeNameChange}
            onKeyEnter={props.onSave}
        />

        <LabelStyled>TV mode:</LabelStyled>
        <TvModeSelect
            tvMode={props.cartridge.tvMode}
            onTvModeChange={props.onTvModeChanged}
        />

        <LabelStyled>Cartridge type:</LabelStyled>
        <CartridgeTypeSelect
            cartridgeType={props.cartridge.cartridgeType}
            onCartridgeTypeChange={props.onCartridgeTypeChange}
        />

        <LabelStyled>Emulate paddles:</LabelStyled>
        <Switch
            state={props.cartridge.emulatePaddles}
            labelTrue='yes'
            labelFalse='no'
            onSwitch={props.onTogglePaddleEmulation}
        />

        <LabelStyled>RNG seed:</LabelStyled>
        <RandomSeedEdit {...props as RandomSeedEdit.Props}/>

        <LabelStyled>Audio:</LabelStyled>
        <Switch
            state={props.cartridge.audioEnabled}
            labelTrue='enabled'
            labelFalse='disabled'
            onSwitch={props.onToggleAudioEnabled}
        />
    </div>;
}

namespace CartridgeSettingsUnstyled {

    export const defaultProps: Props = {
        cartridge: null,

        onCartridgeNameChange: () => undefined,
        onSave: () => undefined,
        onTvModeChanged: () => undefined,
        onTogglePaddleEmulation: () => undefined,
        onToggleAudioEnabled: () => undefined,
        onCartridgeTypeChange: () => undefined,
        onChangeSeedStrategy: () => undefined,
        onChangeSeedValue: () => undefined
    };

}

const LabelStyled = styled(ControlLabel)`
    display: block;

    &:not(:first-child) {
        margin-top: 1rem;
    }
`;

type CartridgeSettingsStyled = StyledComponent<Props, void>;

const CartridgeSettingsStyled: CartridgeSettingsStyled = styled(CartridgeSettingsUnstyled)`
    ${p => p.cartridge ? '' : 'display: none;'}
`;

export default CartridgeSettingsStyled;
