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

import StateMachineInterface from '../StateMachineInterface';
import CpuInterface from '../../CpuInterface';
import ResultImpl from '../ResultImpl';
import { freezeImmutables, Immutable } from '../../../../tools/decorators';

class Boot implements StateMachineInterface {
    constructor(state: CpuInterface.State) {
        this._state = state;

        freezeImmutables(this);
    }

    @Immutable reset = (): StateMachineInterface.Result => this._result.read(this._pre1Step, 0xff);

    @Immutable private _pre1Step = (): StateMachineInterface.Result => this._result.read(this._pre2Step, 0x0ff);

    @Immutable private _pre2Step = (): StateMachineInterface.Result => this._result.read(this._stack1Step, 0x0100);

    @Immutable private _stack1Step = (): StateMachineInterface.Result => this._result.read(this._stack2Step, 0x01ff);

    @Immutable
    private _stack2Step = (): StateMachineInterface.Result => {
        this._state.s = 0xfd;
        return this._result.read(this._stack3Step, 0x01fe);
    };

    @Immutable
    private _stack3Step = (): StateMachineInterface.Result => this._result.read(this._readTargetLoStep, 0xfffc);

    @Immutable
    private _readTargetLoStep = (operand: number): StateMachineInterface.Result => {
        this._targetAddress = operand;
        return this._result.read(this._readTargetHiStep, 0xfffd);
    };

    @Immutable
    private _readTargetHiStep = (operand: number): null => {
        this._targetAddress |= operand << 8;
        this._state.p = this._targetAddress;

        return null;
    };

    private _targetAddress = 0;

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
}

export const boot = (state: CpuInterface.State) => new Boot(state);
