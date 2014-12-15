'use strict';

import Instruction = require('./Instruction');
import hex = require('../tools/hex');
import MemoryInterface = require('../machine/MemoryInterface')

class Disassembler {
    constructor(private _memory?: MemoryInterface)
    {}

    disassembleAt(address: number): string {
        var instruction = Instruction.opcodes[this._peek(address)],
            operation = Instruction.Operation[instruction.operation].toUpperCase();

        var read8 =  (a: number = address + 1) =>
            hex.encode(this._peek(a), 2);

        var read16 = (a: number = address + 1) =>
            hex.encode(
                this._peek(a) + (this._peek(a + 1) << 8), 4);

        var decodeSint8 = (value: number) => (value & 0x80) ? (-(~(value-1) & 0xFF)) : value;

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
                var distance = decodeSint8(this._peek(address + 1));

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
        return this._memory.peek(address % 0x10000);
    }

    setMemory(memory: MemoryInterface): Disassembler {
        this._memory = memory;
        return this;
    }

    getMemory(): MemoryInterface {
        return this._memory;
    }
}

export = Disassembler;
