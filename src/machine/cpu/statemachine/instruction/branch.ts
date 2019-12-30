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

class Branch implements StateMachineInterface {
    constructor(state: CpuInterface.State, predicate: Branch.Predicate) {
        this._state = state;
        this._predicate = predicate;

        freezeImmutables(this);
    }

    @Immutable
    reset = (): StateMachineInterface.Result => this._result.read(this._fetchTarget, this._state.p).poll(true);

    @Immutable
    private _fetchTarget = (value: number): StateMachineInterface.Result | null => {
        this._operand = value;
        this._state.p = (this._state.p + 1) & 0xffff;

        return this._predicate(this._state.flags) ? this._result.read(this._firstDummyRead, this._state.p) : null;
    };

    @Immutable
    private _firstDummyRead = (value: number): StateMachineInterface.Result | null => {
        this._target = (this._state.p + (this._operand & 0x80 ? this._operand - 256 : this._operand)) & 0xffff;

        if ((this._target & 0xff00) === (this._state.p & 0xff00)) {
            this._state.p = this._target;
            return null;
        }

        return this._result.read(this._secondDummyRead, (this._state.p & 0xff00) | (this._target & 0x00ff)).poll(true);
    };

    @Immutable
    private _secondDummyRead = (value: number): null => {
        this._state.p = this._target;
        return null;
    };

    private _target = 0;
    private _operand = 0;

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
    @Immutable private readonly _predicate: Branch.Predicate;
}

namespace Branch {
    export interface Predicate {
        (flags: number): boolean;
    }
}

export const branch = (state: CpuInterface.State, predicate: Branch.Predicate) => new Branch(state, predicate);
