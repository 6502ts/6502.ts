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

class AbsoluteIndexed implements AddressingInterface<AbsoluteIndexed> {
    private constructor(
        private readonly _state: CpuInterface.State,
        private readonly _context: StateMachineInterface.CpuContextInterface,
        private readonly _indexExtractor: (s: CpuInterface.State) => number,
        dereference: boolean,
        private readonly _writeOp: boolean
    ) {
        this._dereferenceStep = dereference ? AbsoluteIndexed._dereference : null;
    }

    static absoluteX(
        state: CpuInterface.State,
        context: StateMachineInterface.CpuContextInterface,
        dereference = true,
        writeOp = false
    ): AbsoluteIndexed {
        return new AbsoluteIndexed(state, context, s => s.x, dereference, writeOp);
    }

    static absoluteY(
        state: CpuInterface.State,
        context: StateMachineInterface.CpuContextInterface,
        dereference = true,
        writeOp = false
    ): AbsoluteIndexed {
        return new AbsoluteIndexed(state, context, s => s.y, dereference, writeOp);
    }

    reset(): StateMachineInterface.Step<AbsoluteIndexed> {
        return AbsoluteIndexed._fetchLo;
    }

    private static _fetchLo(self: AbsoluteIndexed): StateMachineInterface.Step<AbsoluteIndexed> {
        self.operand = self._context.read(self._state.p);
        self._state.p = (self._state.p + 1) & 0xffff;

        return AbsoluteIndexed._fetchHi;
    }

    private static _fetchHi(self: AbsoluteIndexed): StateMachineInterface.Step<AbsoluteIndexed> | null {
        self.operand |= self._context.read(self._state.p) << 8;
        self._state.p = (self._state.p + 1) & 0xffff;

        const index = self._indexExtractor(self._state);
        self._carry = (self.operand & 0xff) + index > 0xff;
        self.operand = (self.operand & 0xff00) | ((self.operand + index) & 0xff);

        return self._carry || self._writeOp ? AbsoluteIndexed._dereferenceAndCarry : self._dereferenceStep;
    }

    private static _dereferenceAndCarry(self: AbsoluteIndexed): StateMachineInterface.Step<AbsoluteIndexed> | null {
        self._context.read(self.operand);

        if (self._carry) {
            self.operand = (self.operand + 0x0100) & 0xffff;
        }

        return self._dereferenceStep;
    }

    private static _dereference(self: AbsoluteIndexed): null {
        self.operand = self._context.read(self.operand);

        return null;
    }

    operand = 0;
    private _carry = false;

    private readonly _dereferenceStep: StateMachineInterface.Step<AbsoluteIndexed> | null;
}

export default AbsoluteIndexed;
