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

import CpuInterface from '../../CpuInterface';
import ResultImpl from '../ResultImpl';
import StateMachineInterface from '../StateMachineInterface';

class AbsoluteIndexed implements StateMachineInterface {
    private constructor(
        private readonly _state: CpuInterface.State,
        private readonly _indexExtractor: (s: CpuInterface.State) => number,
        private readonly _next: StateMachineInterface.Step,
        private readonly _writeOp: boolean
    ) {}

    static absoluteX(
        state: CpuInterface.State,
        next: StateMachineInterface.Step = () => null,
        writeOp = false
    ): AbsoluteIndexed {
        return new AbsoluteIndexed(state, s => s.x, next, writeOp);
    }

    static absoluteY(
        state: CpuInterface.State,
        next: StateMachineInterface.Step = () => null,
        writeOp = false
    ): AbsoluteIndexed {
        return new AbsoluteIndexed(state, s => s.y, next, writeOp);
    }

    reset = (): StateMachineInterface.Result => this._result.read(this._fetchLo, this._state.p);

    private _fetchLo = (value: number): StateMachineInterface.Result => {
        this._operand = value;
        this._state.p = (this._state.p + 1) & 0xffff;

        return this._result.read(this._fetchHi, this._state.p);
    };

    private _fetchHi = (value: number): StateMachineInterface.Result | null => {
        this._operand |= value << 8;
        this._state.p = (this._state.p + 1) & 0xffff;

        const index = this._indexExtractor(this._state);
        this._carry = (this._operand & 0xff) + index > 0xff;
        this._operand = (this._operand & 0xff00) | ((this._operand + index) & 0xff);

        return this._carry || this._writeOp
            ? this._result.read(this._dereferenceAndCarry, this._operand)
            : this._next(this._operand);
    };

    private _dereferenceAndCarry = (value: number): StateMachineInterface.Result | null => {
        if (this._carry) {
            this._operand = (this._operand + 0x0100) & 0xffff;
        }

        return this._next(this._operand);
    };

    private _operand = 0;
    private _carry = false;
    private readonly _result = new ResultImpl();
}

export default AbsoluteIndexed;
