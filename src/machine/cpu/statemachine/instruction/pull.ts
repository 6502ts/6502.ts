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

import { freezeImmutables, Immutable } from '../../../../tools/decorators';
import StateMachineInterface from '../StateMachineInterface';
import ResultImpl from '../ResultImpl';
import CpuInterface from '../../CpuInterface';

class Pull implements StateMachineInterface {
    constructor(state: CpuInterface.State, operation: Pull.Operation) {
        this._state = state;
        this._operation = operation;

        freezeImmutables(this);
    }

    @Immutable reset = (): StateMachineInterface.Result => this._result.read(this._dummyRead, this._state.p);

    @Immutable
    private _dummyRead = (): StateMachineInterface.Result =>
        this._result.read(this._incrementS, 0x0100 + this._state.s);

    @Immutable
    private _incrementS = (): StateMachineInterface.Result => {
        this._state.s = (this._state.s + 1) & 0xff;

        return this._result.read(this._pull, 0x0100 + this._state.s);
    };

    @Immutable private _pull = (value: number): null => (this._operation(this._state, value), null);

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
    @Immutable private readonly _operation: Pull.Operation;
}

namespace Pull {
    export interface Operation {
        (state: CpuInterface.State, ooperand: number): void;
    }
}

export const pull = (state: CpuInterface.State, operation: Pull.Operation) => new Pull(state, operation);
