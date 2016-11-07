/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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


// tslint:disable-next-line
import * as React from 'react';

import {ControlLabel} from 'react-bootstrap';

import CartridgeNameInput from './CartridgeNameInput';
import TvModeSelect from './TvModeSelect';
import CartridgeTypeSelect from './CartridgeTypeSelect';
import Switch from '../Switch';
import RandomSeedEdit from './RandomSeedEdit';

function CartridgeSettings(props: CartridgeSettings.Props) {
    return <div className={props.visible ? '' : 'hidden'}>
        <ControlLabel>Name:</ControlLabel>
        <CartridgeNameInput {...props}/>

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>TV mode:</ControlLabel>
        <TvModeSelect {...props}/>

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>Cartridge type:</ControlLabel>
        <CartridgeTypeSelect {...props}/>

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>Emulate paddles:</ControlLabel>
        <Switch
            state={props.emulatePaddles}
            labelTrue="yes"
            labelFalse="no"
            onSwitch={props.onTogglePaddleEmulation}
        />

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>RNG seed:</ControlLabel>
        <RandomSeedEdit {...props}/>

        <ControlLabel style={{display: 'block', marginTop: '1rem'}}>Audio:</ControlLabel>
        <Switch
            state={props.audioEnabled}
            labelTrue="enabled"
            labelFalse="disabled"
            onSwitch={props.onToggleAudioEnabled}
        />
    </div>;
}

module CartridgeSettings {

    export interface Props extends
        CartridgeNameInput.Props,
        TvModeSelect.Props,
        CartridgeTypeSelect.Props,
        RandomSeedEdit.Props
    {
        visible?: boolean;
        emulatePaddles?: boolean;
        audioEnabled?: boolean;

        onTogglePaddleEmulation?: (state: boolean) => void;
        onToggleAudioEnabled?: (state: boolean) => void;
    }

    export const defaultProps: Props = Object.assign(
        {
            visible: false,
            emulatePaddles: true,
            audioEnabled: true,

            onTogglePaddleEmulation: (): void => undefined,
            onToggleAudioEnabled: (): void => undefined
        },
        CartridgeNameInput.defaultProps,
        TvModeSelect.defaultProps,
        CartridgeTypeSelect.defaultProps,
        RandomSeedEdit.defaultProps
    );

}

export default CartridgeSettings;
