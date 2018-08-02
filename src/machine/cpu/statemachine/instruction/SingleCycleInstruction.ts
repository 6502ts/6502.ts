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

import InstructionInterface from './InstructionInterface';
import StateMachineInterface from '../StateMachineInterface';
import CpuInterface from '../../CpuInterface';
import BusInterface from '../../../bus/BusInterface';

class SingleCycleInstruction implements InstructionInterface<SingleCycleInstruction> {
    constructor(
        private readonly _state: CpuInterface.State,
        private readonly _bus: BusInterface,
        private readonly _op: SingleCycleInstruction.Op
    ) {}

    reset(operand: number): StateMachineInterface.Step<SingleCycleInstruction> {
        this._operand = operand;

        return (self: SingleCycleInstruction) => (self._op(self._state, self._bus, self._operand), null);
    }

    private _operand: number;
}

namespace SingleCycleInstruction {
    export interface Op {
        (state: CpuInterface.State, bus: BusInterface, operand: number): void;
    }
}

export default SingleCycleInstruction;
