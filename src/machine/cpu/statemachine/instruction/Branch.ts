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

class Branch implements StateMachineInterface<Branch> {
    constructor(
        private readonly _state: CpuInterface.State,
        private readonly _bus: StateMachineInterface.BusInterface,
        private readonly _predicate: Branch.Predicate
    ) {}

    reset(): StateMachineInterface.Step<Branch> {
        return Branch._fetchTarget;
    }

    private static _fetchTarget(self: Branch): StateMachineInterface.Step<Branch> | null {
        self._operand = self._bus.read(self._state.p);
        self._state.p = (self._state.p + 1) & 0xffff;

        return self._predicate(self._state.flags) ? Branch._firstDummyRead : null;
    }

    private static _firstDummyRead(self: Branch): StateMachineInterface.Step<Branch> | null {
        self._bus.read(self._state.p);

        self._base = (self._state.p - 2) & 0xffff;
        self._target = (self._base + (self._operand & 0x80 ? self._operand - 256 : self._operand)) & 0xffff;

        if ((self._target & 0xff00) === (self._base & 0xff00)) {
            self._state.p = self._target;
            return null;
        }

        return Branch._secondDummyRead;
    }

    private static _secondDummyRead(self: Branch): null {
        self._bus.read((self._base & 0xff00) | (self._target & 0x00ff));

        self._state.p = self._target;
        return null;
    }

    private _base = 0;
    private _target = 0;
    private _operand = 0;
}

namespace Branch {
    export interface Predicate {
        (flags: number): boolean;
    }
}

export default Branch;
