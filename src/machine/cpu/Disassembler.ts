/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import Instruction from './Instruction';
import BusInterface from '../bus/BusInterface';

import * as hex from '../../tools/hex';

class Disassembler {
    constructor(private _bus?: BusInterface) {}

    setBus(bus: BusInterface): Disassembler {
        this._bus = bus;
        return this;
    }

    getBus(): BusInterface {
        return this._bus;
    }

    disassembleAt(address: number): string {
        const instruction = Instruction.opcodes[this._peek(address)],
            operation = Instruction.OperationMap[instruction.operation].toUpperCase();

        const read8 = (a: number = address + 1) => hex.encode(this._peek(a), 2);

        const read16 = (a: number = address + 1) => hex.encode(this._peek(a) + (this._peek(a + 1) << 8), 4);

        const decodeSint8 = (value: number) => (value & 0x80 ? -(~(value - 1) & 0xff) : value);

        switch (instruction.effectiveAddressingMode) {
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

                return (
                    operation +
                    ' ' +
                    hex.encode(distance, 2) +
                    ' ; -> ' +
                    hex.encode((0x10002 + address + distance) % 0x10000, 4)
                );

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
        return this._bus.peek(address % 0x10000);
    }
}

export { Disassembler as default };
