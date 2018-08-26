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

class IndexedIndirectX implements StateMachineInterface {
    constructor(
        private readonly _state: CpuInterface.State,
        private readonly _next: StateMachineInterface.Step = () => null
    ) {}

    reset = (): StateMachineInterface.Result => this._result.read(this._fetchAddress, this._state.p);

    private _fetchAddress = (value: number): StateMachineInterface.Result => {
        this._address = value;
        this._state.p = (this._state.p + 1) & 0xffff;

        return this._result.read(this._addIndex, this._address);
    };

    private _addIndex = (value: number): StateMachineInterface.Result => {
        this._address = (this._address + this._state.x) & 0xff;

        return this._result.read(this._fetchLo, this._address);
    };

    private _fetchLo = (value: number): StateMachineInterface.Result => {
        this._operand = value;
        this._address = (this._address + 1) & 0xff;

        return this._result.read(this._fetchHi, this._address);
    };

    private _fetchHi = (value: number): StateMachineInterface.Result | null => {
        this._operand |= value << 8;

        return this._next(this._operand);
    };

    private _operand = 0;
    private _address = 0;
    private readonly _result = new ResultImpl();
}

export const indexedIndirectX = (state: CpuInterface.State, next: StateMachineInterface.Step) =>
    new IndexedIndirectX(state, next);
