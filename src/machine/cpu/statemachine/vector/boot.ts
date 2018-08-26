/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import StateMachineInterface from '../StateMachineInterface';
import CpuInterface from '../../CpuInterface';
import ResultImpl from '../ResultImpl';

class Boot implements StateMachineInterface {
    constructor(private readonly _state: CpuInterface.State) {}

    reset = (): StateMachineInterface.Result => this._result.read(this._pre1Step, 0xff);

    private _pre1Step = (): StateMachineInterface.Result => this._result.read(this._pre2Step, 0x0ff);

    private _pre2Step = (): StateMachineInterface.Result => this._result.read(this._stack1Step, 0x0100);

    private _stack1Step = (): StateMachineInterface.Result => this._result.read(this._stack2Step, 0x01ff);

    private _stack2Step = (): StateMachineInterface.Result => {
        this._state.s = 0xfd;
        return this._result.read(this._stack3Step, 0x01fe);
    };

    private _stack3Step = (): StateMachineInterface.Result => this._result.read(this._readTargetLoStep, 0xfffc);

    private _readTargetLoStep = (operand: number): StateMachineInterface.Result => {
        this._targetAddress = operand;
        return this._result.read(this._readTargetHiStep, 0xfffd);
    };

    private _readTargetHiStep = (operand: number): null => {
        this._targetAddress |= operand << 8;
        this._state.p = this._targetAddress;

        return null;
    };

    private _targetAddress = 0;
    private readonly _result = new ResultImpl();
}

export const boot = (state: CpuInterface.State) => new Boot(state);
