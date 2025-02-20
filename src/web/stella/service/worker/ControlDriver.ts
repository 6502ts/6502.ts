/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import EmulationContextInterface from '../EmulationContextInterface';
import ControlState from './ControlState';
import { RpcProviderInterface } from 'worker-rpc';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';

import { SIGNAL_TYPE } from './messages';
import KeypadControllerInterface from '../../../../machine/io/KeypadControllerInterface';

class ControlDriver {
    constructor(private _rpc: RpcProviderInterface) { }

    init(): void {
        this._rpc.registerSignalHandler(SIGNAL_TYPE.controlStateUpdate, this._onControlStateUpdate.bind(this));
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

        for (let i = 0; i < 2; i++) {
            this._applyKeypadState(controlState.keypadState[i], this._emulationContext.getKeypad(i));
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

    private _applyKeypadState(state: ControlState.KeypadState, keypad: KeypadControllerInterface): void {
        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 3; col++) {
                keypad.getKey(row, col).toggle(state.rows[row][col]);
            }
        }
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

export { ControlDriver as default };
