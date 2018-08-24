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

class ReadModifyWrite implements StateMachineInterface<number> {
    constructor(
        private readonly _state: CpuInterface.State,
        private readonly _operation: (operand: number, s: CpuInterface.State) => number
    ) {}

    reset = (address: number): StateMachineInterface.Result => {
        this._address = address;

        return this._result.read(this._read, address);
    };

    private _read = (value: number): StateMachineInterface.Result => {
        this._operand = value;

        return this._result.write(this._dummyWrite, this._address, this._operand);
    };

    private _dummyWrite = (value: number): StateMachineInterface.Result =>
        this._result.write(this._write, this._address, this._operation(this._operand, this._state));

    private _write = (): null => null;

    private _address: number;
    private _operand: number;
    private readonly _result = new ResultImpl();
}

export default ReadModifyWrite;
