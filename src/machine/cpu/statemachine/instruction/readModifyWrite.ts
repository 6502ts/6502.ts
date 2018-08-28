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

class ReadModifyWrite implements StateMachineInterface<number> {
    constructor(state: CpuInterface.State, operation: ReadModifyWrite.Operation) {
        this._state = state;
        this._operation = operation;

        freezeImmutables(this);
    }

    @Immutable
    reset = (address: number): StateMachineInterface.Result => {
        this._address = address;

        return this._result.read(this._read, address);
    };

    @Immutable
    private _read = (value: number): StateMachineInterface.Result => {
        this._operand = value;

        return this._result.write(this._dummyWrite, this._address, this._operand);
    };

    @Immutable
    private _dummyWrite = (value: number): StateMachineInterface.Result =>
        this._result.write(this._write, this._address, this._operation(this._operand, this._state));

    @Immutable private _write = (): null => null;

    private _address: number;
    private _operand: number;

    @Immutable private readonly _result = new ResultImpl();

    @Immutable private readonly _state: CpuInterface.State;
    @Immutable private readonly _operation: ReadModifyWrite.Operation;
}

namespace ReadModifyWrite {
    export interface Operation {
        (o: number, s: CpuInterface.State): number;
    }
}

export const readModifyWrite = (state: CpuInterface.State, operation: ReadModifyWrite.Operation) =>
    new ReadModifyWrite(state, operation);
