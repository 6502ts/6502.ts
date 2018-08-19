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
import StateMachineInterface from '../StateMachineInterface';
import AddressingInterface from './AddressingInterface';

class IndexedIndirectX implements AddressingInterface<IndexedIndirectX> {
    constructor(
        private readonly _state: CpuInterface.State,
        private readonly _context: StateMachineInterface.CpuContextInterface,
        dereference = true
    ) {
        this._dereferenceStep = dereference ? IndexedIndirectX._dereference : null;
    }

    reset(): StateMachineInterface.Step<IndexedIndirectX> {
        return IndexedIndirectX._fetchAddress;
    }

    private static _fetchAddress(self: IndexedIndirectX): StateMachineInterface.Step<IndexedIndirectX> {
        self._address = self._context.read(self._state.p);
        self._state.p = (self._state.p + 1) & 0xffff;

        return IndexedIndirectX._addIndex;
    }

    private static _addIndex(self: IndexedIndirectX): StateMachineInterface.Step<IndexedIndirectX> {
        self._context.read(self._address);
        self._address = (self._address + self._state.x) & 0xff;

        return IndexedIndirectX._fetchLo;
    }

    private static _fetchLo(self: IndexedIndirectX): StateMachineInterface.Step<IndexedIndirectX> {
        self.operand = self._context.read(self._address);
        self._address = (self._address + 1) & 0xff;

        return IndexedIndirectX._fetchHi;
    }

    private static _fetchHi(self: IndexedIndirectX): StateMachineInterface.Step<IndexedIndirectX> | null {
        self.operand |= self._context.read(self._address) << 8;

        return self._dereferenceStep;
    }

    private static _dereference(self: IndexedIndirectX): null {
        self.operand = self._context.read(self.operand);

        return null;
    }

    operand = 0;

    private _address = 0;
    private readonly _dereferenceStep: StateMachineInterface.Step<IndexedIndirectX> | null;
}

export default IndexedIndirectX;
