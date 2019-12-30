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

import CpuInterface from '../../CpuInterface';
import ResultImpl from '../ResultImpl';
import StateMachineInterface from '../StateMachineInterface';
import { freezeImmutables, Immutable } from '../../../../tools/decorators';
import NextStep from './NextStep';

class IndexedIndirectY implements StateMachineInterface {
    constructor(state: CpuInterface.State, next: NextStep = () => null, writeOp: boolean) {
        this._state = state;
        this._next = next;
        this._writeOp = writeOp;

        freezeImmutables(this);
    }

    @Immutable reset = (): StateMachineInterface.Result => this._result.read(this._fetchAddress, this._state.p);

    @Immutable
    private _fetchAddress = (value: number): StateMachineInterface.Result => {
        this._address = value;
        this._state.p = (this._state.p + 1) & 0xffff;

        return this._result.read(this._fetchLo, this._address);
    };

    @Immutable
    private _fetchLo = (value: number): StateMachineInterface.Result => {
        this._operand = value;
        this._address = (this._address + 1) & 0xff;

        return this._result.read(this._fetchHi, this._address);
    };

    @Immutable
    private _fetchHi = (value: number): StateMachineInterface.Result | null => {
        this._operand |= value << 8;

        this._carry = (this._operand & 0xff) + this._state.y > 0xff;
        this._operand = (this._operand & 0xff00) | ((this._operand + this._state.y) & 0xff);

        return this._carry || this._writeOp
            ? this._result.read(this._dereferenceAndCarry, this._operand)
            : this._next(this._operand, this._state);
    };

    @Immutable
    private _dereferenceAndCarry = (value: number): StateMachineInterface.Result | null => {
        if (this._carry) {
            this._operand = (this._operand + 0x0100) & 0xffff;
        }

        return this._next(this._operand, this._state);
    };

    private _operand = 0;
    private _address = 0;
    private _carry = false;

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
    @Immutable private readonly _next: NextStep;
    @Immutable private readonly _writeOp: boolean;
}

export const indirectIndexedY = (state: CpuInterface.State, next: NextStep, writeOp: boolean) =>
    new IndexedIndirectY(state, next, writeOp);
