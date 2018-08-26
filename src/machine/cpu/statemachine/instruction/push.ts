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
import CpuInterface from '../../CpuInterface';
import StateMachineInterface from '../StateMachineInterface';
import ResultImpl from '../ResultImpl';

class Push implements StateMachineInterface {
    constructor(state: CpuInterface.State, operation: Push.Operation) {
        this._state = state;
        this._operation = operation;

        freezeImmutables(this);
    }

    @Immutable reset = (): StateMachineInterface.Result => this._result.read(this._dummyRead, this._state.p);

    @Immutable
    private _dummyRead = (): StateMachineInterface.Result =>
        this._result.write(this._push, 0x0100 + this._state.s, this._operation(this._state));

    @Immutable
    private _push = (): null => {
        this._state.s = (this._state.s - 1) & 0xff;

        return null;
    };

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
    @Immutable private readonly _operation: Push.Operation;
}

namespace Push {
    export interface Operation {
        (s: CpuInterface.State): number;
    }
}

export const push = (state: CpuInterface.State, operation: Push.Operation) => new Push(state, operation);
