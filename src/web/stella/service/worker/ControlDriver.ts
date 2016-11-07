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


import EmulationContextInterface from '../EmulationContextInterface';
import ControlState from './ControlState';
import {RpcProviderInterface} from 'worker-rpc';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';

import {
    SIGNAL_TYPE
} from './messages';

class ControlDriver {

    constructor(
        private _rpc: RpcProviderInterface
    ) {}

    init(): void {
        this._rpc
            .registerSignalHandler(SIGNAL_TYPE.controlStateUpdate, this._onControlStateUpdate.bind(this));
    }

    bind(emulationContext: EmulationContextInterface): void {
        if (this._active) {
            return;
        }

        this._active = true;
        this._emulationContext = emulationContext;
    }

    unbind(): void {
        if (!this._active) {
            return;
        }

        this._active = false;
        this._emulationContext = null;
    }

    private _onControlStateUpdate(controlState: ControlState): void {
        if (!this._active) {
            return;
        }

        for (let i = 0; i < 2; i++) {
            this._applyJoystickState(controlState.joystickState[i], this._emulationContext.getJoystick(i));
        }

        for (let i = 0; i < 4; i++) {
            this._applyPaddleState(controlState.paddleState[i], this._emulationContext.getPaddle(i));
        }

        this._applyControlPanelState(controlState.controlPanelState, this._emulationContext.getControlPanel());
    }

    private _applyJoystickState(state: ControlState.JoystickState, joystick: JoystickInterface): void {
        joystick.getUp().toggle(state.up);
        joystick.getDown().toggle(state.down);
        joystick.getLeft().toggle(state.left);
        joystick.getRight().toggle(state.right);
        joystick.getFire().toggle(state.fire);
    }

    private _applyPaddleState(state: ControlState.PaddleState, paddle: PaddleInterface): void {
        paddle.setValue(state.value);
        paddle.getFire().toggle(state.fire);
    }

    private _applyControlPanelState(state: ControlState.ControlPanelState, panel: ControlPanelInterface): void {
        panel.getDifficultySwitchP0().toggle(state.difficulty0);
        panel.getDifficultySwitchP1().toggle(state.difficulty1);
        panel.getResetButton().toggle(state.reset);
        panel.getColorSwitch().toggle(state.color);
        panel.getSelectSwitch().toggle(state.select);
    }

    private _active = false;
    private _emulationContext: EmulationContextInterface = null;

}

export default ControlDriver;