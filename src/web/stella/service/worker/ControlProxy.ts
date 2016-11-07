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

import Joystick from '../../../../machine/io/DigitalJoystick';
import ControlPanel from '../../../../machine/stella/ControlPanel';
import Paddle from '../../../../machine/io/Paddle';
import ControlState from './ControlState';
import {RpcProviderInterface} from 'worker-rpc';

import {
    SIGNAL_TYPE
} from './messages';

class ControlProxy {

    constructor(
        private _rpc: RpcProviderInterface
    ) {
        for (let i = 0; i < 2; i++) {
            this._joysticks[i] = new Joystick();
        }

        for (let i = 0; i < 4; i++) {
            this._paddles[i] = new Paddle();
        }
    }

    sendUpdate(): void {
        this._rpc.signal<ControlState>(
            SIGNAL_TYPE.controlStateUpdate,
            {
                joystickState: this._joysticks.map(ControlProxy._joystickState),
                paddleState: this._paddles.map(ControlProxy._paddleState),
                controlPanelState: ControlProxy._controlPanelState(this._controlPanel)
            }
        );
    }

    getJoystick(i: number): Joystick {
        if (i < 0 || i > 1) {
            throw new Error(`invalid joystick index ${i}`);
        }

        return this._joysticks[i];
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
    private _controlPanel = new ControlPanel();

}

export default ControlProxy;
