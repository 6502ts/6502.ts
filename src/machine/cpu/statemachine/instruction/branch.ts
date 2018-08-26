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

class Branch implements StateMachineInterface {
    constructor(private readonly _state: CpuInterface.State, private readonly _predicate: Branch.Predicate) {}

    reset = (): StateMachineInterface.Result => this._result.read(this._fetchTarget, this._state.p);

    private _fetchTarget = (value: number): StateMachineInterface.Result | null => {
        this._operand = value;
        this._state.p = (this._state.p + 1) & 0xffff;

        return this._predicate(this._state.flags) ? this._result.read(this._firstDummyRead, this._state.p) : null;
    };

    private _firstDummyRead = (value: number): StateMachineInterface.Result | null => {
        this._target = (this._state.p + (this._operand & 0x80 ? this._operand - 256 : this._operand)) & 0xffff;

        if ((this._target & 0xff00) === (this._state.p & 0xff00)) {
            this._state.p = this._target;
            return null;
        }

        return this._result.read(this._secondDummyRead, (this._state.p & 0xff00) | (this._target & 0x00ff));
    };

    private _secondDummyRead = (value: number): null => {
        this._state.p = this._target;
        return null;
    };

    private _target = 0;
    private _operand = 0;

    private readonly _result = new ResultImpl();
}

namespace Branch {
    export interface Predicate {
        (flags: number): boolean;
    }
}

export const branch = (state: CpuInterface.State, predicate: Branch.Predicate) => new Branch(state, predicate);
