/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

import Instruction from './Instruction';
import BusInterface from '../bus/BusInterface';

import * as hex from '../../tools/hex';

class Disassembler {
    constructor(private _bus?: BusInterface)
    {}

    disassembleAt(address: number): string {
        const instruction = Instruction.opcodes[this._peek(address)],
            operation = Instruction.OperationMap[instruction.operation].toUpperCase();

        const read8 =  (a: number = address + 1) =>
            hex.encode(this._peek(a), 2);

        const read16 = (a: number = address + 1) =>
            hex.encode(
                this._peek(a) + (this._peek(a + 1) << 8), 4);

        const decodeSint8 = (value: number) => (value & 0x80) ? (-(~(value-1) & 0xFF)) : value;

        switch (instruction.addressingMode) {
            case Instruction.AddressingMode.implied:
                return operation;

            case Instruction.AddressingMode.immediate:
                return operation + ' #' + read8();

            case Instruction.AddressingMode.zeroPage:
                return operation + ' ' + read8();

            case Instruction.AddressingMode.absolute:
                return operation + ' ' + read16();

            case Instruction.AddressingMode.indirect:
                return operation + ' (' + read16() + ')';

            case Instruction.AddressingMode.relative:
                const distance = decodeSint8(this._peek(address + 1));

                return operation + ' ' +
                    hex.encode(distance, 2) + ' ; -> '
                    + hex.encode((0x10002 + address + distance) % 0x10000, 4);

            case Instruction.AddressingMode.zeroPageX:
                return operation + ' ' + read8() + ',X';

            case Instruction.AddressingMode.absoluteX:
                return operation + ' ' + read16() + ',X';

            case Instruction.AddressingMode.indexedIndirectX:
                return operation + ' (' + read8() + ',X)';

            case Instruction.AddressingMode.zeroPageY:
                return operation + ' ' + read8() + ',Y';

            case Instruction.AddressingMode.absoluteY:
                return operation + ' ' + read16() + ',Y';

            case Instruction.AddressingMode.indirectIndexedY:
                return operation + ' (' + read8() + '),Y';

            default:
                return 'INVALID';
        }
    }

    private _peek(address: number) {
        return this._bus.read(address % 0x10000);
    }

    setBus(bus: BusInterface): Disassembler {
        this._bus = bus;
        return this;
    }

    getBus(): BusInterface {
        return this._bus;
    }
}

export default Disassembler;
