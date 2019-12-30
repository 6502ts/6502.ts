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

class Rts implements StateMachineInterface {
    constructor(state: CpuInterface.State) {
        this._state = state;

        freezeImmutables(this);
    }

    @Immutable reset = (): StateMachineInterface.Result => this._result.read(this._dummyOperandRead, this._state.p);

    @Immutable
    private _dummyOperandRead = (): StateMachineInterface.Result =>
        this._result.read(this._dummyStackRead, 0x0100 + this._state.s);

    @Immutable
    private _dummyStackRead = (): StateMachineInterface.Result => {
        this._state.s = (this._state.s + 1) & 0xff;

        return this._result.read(this._popPcl, 0x0100 + this._state.s);
    };

    @Immutable
    private _popPcl = (value: number): StateMachineInterface.Result => {
        this._state.p = (this._state.p & 0xff00) | value;
        this._state.s = (this._state.s + 1) & 0xff;

        return this._result.read(this._popPch, 0x0100 + this._state.s);
    };

    @Immutable
    private _popPch = (value: number): StateMachineInterface.Result => {
        this._state.p = (this._state.p & 0xff) | (value << 8);

        return this._result.read(this._incrementP, this._state.p);
    };

    @Immutable
    private _incrementP = (): null => {
        this._state.p = (this._state.p + 1) & 0xffff;

        return null;
    };

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
}

export const rts = (state: CpuInterface.State) => new Rts(state);
