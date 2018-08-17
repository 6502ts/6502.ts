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

class Indirect implements AddressingInterface<Indirect> {
    constructor(
        private readonly _state: CpuInterface.State,
        private readonly _bus: StateMachineInterface.BusInterface
    ) {}

    reset(): StateMachineInterface.Step<Indirect> {
        return Indirect._fetchAddressLo;
    }

    private static _fetchAddressLo(self: Indirect): StateMachineInterface.Step<Indirect> {
        self._address = self._bus.read(self._state.p);
        self._state.p = (self._state.p + 1) & 0xffff;

        return Indirect._fetchAddressHi;
    }

    private static _fetchAddressHi(self: Indirect): StateMachineInterface.Step<Indirect> {
        self._address |= self._bus.read(self._state.p) << 8;
        self._state.p = (self._state.p + 1) & 0xffff;

        return Indirect._fetchLo;
    }

    private static _fetchLo(self: Indirect): StateMachineInterface.Step<Indirect> {
        self.operand = self._bus.read(self._address);

        if ((self._address & 0xff) === 0xff) {
            self._address &= 0xff00;
        } else {
            self._address = (self._address + 1) & 0xffff;
        }

        return Indirect._fetchHi;
    }

    private static _fetchHi(self: Indirect): StateMachineInterface.Step<Indirect> {
        self.operand |= self._bus.read(self._address) << 8;

        return null;
    }

    operand = 0;

    private _address = 0;
}

export default Indirect;
