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

class ZeroPageIndexed implements StateMachineInterface {
    private constructor(state: CpuInterface.State, indexExtractor: ZeroPageIndexed.IndexExtractor, next: NextStep) {
        this._state = state;
        this._indexExtractor = indexExtractor;
        this._next = next;

        freezeImmutables(this);
    }

    static zeroPageX(state: CpuInterface.State, next: NextStep = () => null): ZeroPageIndexed {
        return new ZeroPageIndexed(state, s => s.x, next);
    }

    static zeroPageY(state: CpuInterface.State, next: NextStep = () => null): ZeroPageIndexed {
        return new ZeroPageIndexed(state, s => s.y, next);
    }

    @Immutable reset = (): StateMachineInterface.Result => this._result.read(this._fetchAddress, this._state.p);

    @Immutable
    private _fetchAddress = (value: number): StateMachineInterface.Result => {
        this._operand = value;
        this._state.p = (this._state.p + 1) & 0xffff;

        return this._result.read(this._addIndex, this._operand);
    };

    @Immutable
    private _addIndex = (value: number): StateMachineInterface.Result | null => {
        this._operand = (this._operand + this._indexExtractor(this._state)) & 0xff;

        return this._next(this._operand, this._state);
    };

    private _operand = 0;

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
    @Immutable private readonly _next: NextStep;
    @Immutable private readonly _indexExtractor: ZeroPageIndexed.IndexExtractor;
}

namespace ZeroPageIndexed {
    export interface IndexExtractor {
        (s: CpuInterface.State): number;
    }
}

export const zeroPageX = (state: CpuInterface.State, next: NextStep) => ZeroPageIndexed.zeroPageX(state, next);

export const zeroPageY = (state: CpuInterface.State, next: NextStep) => ZeroPageIndexed.zeroPageY(state, next);
