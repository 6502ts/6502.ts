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

import Joystick from '../../../../machine/io/DigitalJoystick';
import ControlPanel from '../../../../machine/stella/ControlPanel';
import Paddle from '../../../../machine/io/Paddle';
import ControlState from './ControlState';
import { RpcProviderInterface } from 'worker-rpc';

import { SIGNAL_TYPE } from './messages';
import KeypadController from '../../../../machine/io/KeypadController';

class ControlProxy {
    constructor(private _rpc: RpcProviderInterface) {
        for (let i = 0; i < 2; i++) {
            this._joysticks[i] = new Joystick();
        }

        for (let i = 0; i < 2; i++) {
            this._keypads[i] = new KeypadController();
        }

        for (let i = 0; i < 4; i++) {
            this._paddles[i] = new Paddle();
        }
    }

    sendUpdate(): void {
        this._rpc.signal<ControlState>(SIGNAL_TYPE.controlStateUpdate, {
            joystickState: this._joysticks.map(ControlProxy._joystickState),
            keypadState: this._keypads.map(ControlProxy._keypadState),
            paddleState: this._paddles.map(ControlProxy._paddleState),
            controlPanelState: ControlProxy._controlPanelState(this._controlPanel)
        });
    }

    getJoystick(i: number): Joystick {
        if (i < 0 || i > 1) {
            throw new Error(`invalid joystick index ${i}`);
        }

        return this._joysticks[i];
    }

    getKeypad(i: number): KeypadController {
        if (i < 0 || i > 1) {
            throw new Error(`invalid keypad index ${i}`);
        }
        return this._keypads[i];
    }

    getControlPanel(): ControlPanel {
        return this._controlPanel;
    }

    getPaddle(i: number): Paddle {
        if (i < 0 || i > 3) {
            throw new Error(`invalid paddle index ${i}`);
        }

        return this._paddles[i];
    }

    private static _joystickState(joystick: Joystick): ControlState.JoystickState {
        return {
            up: joystick.getUp().read(),
            down: joystick.getDown().read(),
            left: joystick.getLeft().read(),
            right: joystick.getRight().read(),
            fire: joystick.getFire().read()
        };
    }

    private static _keypadState(keypad: KeypadController): ControlState.KeypadState {
        const state = {
            rows: new Array(4)
        };
        for (var row = 0; row < 4; row++) {
            state.rows[row] = new Array(3);
            for (var col = 0; col < 3; col++) {
                state.rows[row][col] = keypad.getKey(row, col).read();
            }
        }
        return state;
    }

    private static _paddleState(paddle: Paddle): ControlState.PaddleState {
        return {
            value: paddle.getValue(),
            fire: paddle.getFire().read()
        };
    }

    private static _controlPanelState(controlPanel: ControlPanel): ControlState.ControlPanelState {
        return {
            difficulty0: controlPanel.getDifficultySwitchP0().read(),
            difficulty1: controlPanel.getDifficultySwitchP1().read(),
            select: controlPanel.getSelectSwitch().read(),
            reset: controlPanel.getResetButton().read(),
            color: controlPanel.getColorSwitch().read()
        };
    }

    private _joysticks = new Array<Joystick>(2);
    private _paddles = new Array<Paddle>(4);
    private _keypads = new Array<KeypadController>(2);
    private _controlPanel = new ControlPanel();

}

export { ControlProxy as default };
