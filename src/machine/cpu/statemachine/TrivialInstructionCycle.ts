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

import StateMachineInterface from './StateMachineInterface';
import AddressingInterface from './addressing/AddressingInterface';
import CpuInterface from '../CpuInterface';

class TrivialInstructionCycle<Addressing extends AddressingInterface<Addressing>> {
    constructor(
        private readonly _addressing: Addressing,
        private readonly _op: TrivialInstructionCycle.Op,
        private readonly _state: CpuInterface.State
    ) {}

    reset(): StateMachineInterface.Step<TrivialInstructionCycle<Addressing>> {
        this._nextAddressingStep = this._addressing.reset();

        return TrivialInstructionCycle._addressingStep;
    }

    private static _addressingStep<Addressing extends AddressingInterface<Addressing>>(
        self: TrivialInstructionCycle<Addressing>
    ): StateMachineInterface.Step<TrivialInstructionCycle<Addressing>> {
        self._nextAddressingStep = self._nextAddressingStep(self._addressing);

        if (self._nextAddressingStep !== null) {
            return TrivialInstructionCycle._addressingStep;
        }

        self._op(self._state, self._addressing.operand);

        return null;
    }

    private _nextAddressingStep: StateMachineInterface.Step<Addressing> = null;
}

namespace TrivialInstructionCycle {
    export interface Op {
        (state: CpuInterface.State, operand: number): void;
    }
}

export default TrivialInstructionCycle;
