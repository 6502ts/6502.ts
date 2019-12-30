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

class Interrupt implements StateMachineInterface {
    constructor(state: CpuInterface.State, defaultVector: number, isBrk: boolean) {
        this._state = state;
        this._defaultVector = defaultVector;
        this._isBrk = isBrk;

        freezeImmutables(this);
    }

    @Immutable reset = (): StateMachineInterface.Result => this._result.read(this._dummyRead, this._state.p);

    @Immutable
    private _dummyRead = (): StateMachineInterface.Result => {
        if (this._isBrk) {
            this._state.p = (this._state.p + 1) & 0xffff;
        }

        return this._result.write(this._pushPch, 0x0100 + this._state.s, this._state.p >>> 8);
    };

    @Immutable
    private _pushPch = (): StateMachineInterface.Result => {
        this._state.s = (this._state.s - 1) & 0xff;

        return this._result.write(this._pushPcl, 0x0100 + this._state.s, this._state.p & 0xff).poll(true);
    };

    @Immutable
    private _pushPcl = (): StateMachineInterface.Result => {
        this._state.s = (this._state.s - 1) & 0xff;
        this._vector = this._state.nmi ? 0xfffa : this._defaultVector;

        return this._result.write(
            this._pushFlags,
            0x0100 + this._state.s,
            this._isBrk ? this._state.flags | CpuInterface.Flags.b : this._state.flags & ~CpuInterface.Flags.b
        );
    };

    @Immutable
    private _pushFlags = (): StateMachineInterface.Result => {
        this._state.s = (this._state.s - 1) & 0xff;

        return this._result.read(this._fetchPcl, this._vector);
    };

    @Immutable
    private _fetchPcl = (value: number): StateMachineInterface.Result => {
        this._state.flags |= CpuInterface.Flags.i;
        this._state.p = value;

        return this._result.read(this._fetchPch, ++this._vector);
    };

    @Immutable
    private _fetchPch = (value: number): null => {
        this._state.p = this._state.p | (value << 8);
        this._state.nmi = this._state.irq = false;

        return null;
    };

    private _vector = 0;

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
    @Immutable private readonly _defaultVector: number;
    @Immutable private readonly _isBrk: boolean;
}

export const brk = (state: CpuInterface.State) => new Interrupt(state, 0xfffe, true);
export const irq = (state: CpuInterface.State) => new Interrupt(state, 0xfffe, false);
export const nmi = (state: CpuInterface.State) => new Interrupt(state, 0xfffa, false);
