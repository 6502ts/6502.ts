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
import InstructionInterface from './instruction/InstructionInterface';
import CpuInterface from '../CpuInterface';
import BusInterface from '../../bus/BusInterface';

class InstructionCycle<
    Addressing extends AddressingInterface<Addressing>,
    Instruction extends InstructionInterface<Instruction>
> implements StateMachineInterface<InstructionCycle<Addressing, Instruction>> {
    constructor(
        private readonly _addressing: Addressing,
        private readonly _instruction: Instruction,
        private readonly _state: CpuInterface.State,
        private readonly _bus: BusInterface,
        private readonly _dereference = false
    ) {}

    reset(): StateMachineInterface.Step<InstructionCycle<Addressing, Instruction>> {
        this._nextAddressingStep = this._addressing.reset();

        return InstructionCycle._addressingStep;
    }

    private static _addressingStep<
        Addressing extends AddressingInterface<Addressing>,
        Instruction extends InstructionInterface<Instruction>
    >(
        self: InstructionCycle<Addressing, Instruction>
    ): StateMachineInterface.Step<InstructionCycle<Addressing, Instruction>> {
        self._nextAddressingStep = self._nextAddressingStep(self._addressing);

        if (self._nextAddressingStep) {
            return InstructionCycle._addressingStep;
        }

        if (self._dereference) {
            return InstructionCycle._dereference;
        }

        self._nextInstructionStep = self._instruction.reset(self._addressing.operand);
        return InstructionCycle._instructionStep;
    }

    private static _dereference<
        Addressing extends AddressingInterface<Addressing>,
        Instruction extends InstructionInterface<Instruction>
    >(
        self: InstructionCycle<Addressing, Instruction>
    ): StateMachineInterface.Step<InstructionCycle<Addressing, Instruction>> {
        self._nextInstructionStep = self._instruction.reset(self._bus.read(self._addressing.operand));
        self._state.p = (self._state.p + 1) & 0xffff;

        return InstructionCycle._instructionStep;
    }

    private static _instructionStep<
        Addressing extends AddressingInterface<Addressing>,
        Instruction extends InstructionInterface<Instruction>
    >(
        self: InstructionCycle<Addressing, Instruction>
    ): StateMachineInterface.Step<InstructionCycle<Addressing, Instruction>> {
        self._nextInstructionStep = self._nextInstructionStep(self._instruction);

        return self._nextAddressingStep && InstructionCycle._instructionStep;
    }

    private _nextAddressingStep: StateMachineInterface.Step<Addressing> = null;
    private _nextInstructionStep: StateMachineInterface.Step<Instruction> = null;
}

export default InstructionCycle;
