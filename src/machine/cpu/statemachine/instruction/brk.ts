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
import { freezeImmutables, Immutable } from '../../../../tools/decorators';

class Brk implements StateMachineInterface {
    constructor(state: CpuInterface.State) {
        this._state = state;

        freezeImmutables(this);
    }

    @Immutable reset = (): StateMachineInterface.Result => this._result.read(this._dummyRead, this._state.p);

    @Immutable
    private _dummyRead = (): StateMachineInterface.Result => {
        this._state.p = (this._state.p + 1) & 0xffff;

        return this._result.write(this._pushPch, 0x0100 + this._state.s, this._state.p >>> 8);
    };

    @Immutable
    private _pushPch = (): StateMachineInterface.Result => {
        this._state.s = (this._state.s - 1) & 0xff;

        return this._result.write(this._pushPcl, 0x0100 + this._state.s, this._state.p & 0xff);
    };

    @Immutable
    private _pushPcl = (): StateMachineInterface.Result => {
        this._state.s = (this._state.s - 1) & 0xff;
        this._vector = this._state.nmi ? 0xfffa : 0xfffe;

        return this._result.write(this._pushFlags, 0x0100 + this._state.s, this._state.flags | CpuInterface.Flags.b);
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

        return null;
    };

    private _vector = 0;

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
}

export const brk = (state: CpuInterface.State) => new Brk(state);
