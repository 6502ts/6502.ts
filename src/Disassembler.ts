/// <reference path='./MemoryInterface.ts'/>

import Instruction = require('./Instruction');
import hex = require('./hex');

class Disassembler {
    constructor(private memory?: MemoryInterface)
    {}

    disassembleAt(address: number): string {
        var instruction = Instruction.encodings[this.memory.read(address)],
            opcode = Instruction.Opcode[instruction.opcode].toUpperCase();

        if (address + instruction.getSize() - 1 > 0xFFFF) return 'INVALID';

        var read8 =  (a: number = address + 1) =>
            hex.encode(this.memory.read(a), 2);

        var read16 = (a: number = address + 1) =>
            hex.encode(
                this.memory.read(a) + (this.memory.read(a + 1) << 8), 4);

        function decodeSint8(value: number): number {
            return (value & 0x80) ? (-(~(value-1) & 0xFF)) : value;

        }

        switch (instruction.addressingMode) {
            case Instruction.AddressingMode.implied:
                return opcode;

            case Instruction.AddressingMode.immediate:
                return opcode + ' #' + read8();

            case Instruction.AddressingMode.zeroPage:
                return opcode + ' ' + read8();

            case Instruction.AddressingMode.absolute:
                return opcode + ' ' + read16();

            case Instruction.AddressingMode.indirect:
                return opcode + ' (' + read16() + ')';

            case Instruction.AddressingMode.relative:
                return opcode + ' ' +
                    hex.encode(decodeSint8(this.memory.read(address + 1)));

            case Instruction.AddressingMode.zeroPageX:
                return opcode + ' ' + read8() + ',X';

            case Instruction.AddressingMode.absoluteX:
                return opcode + ' ' + read16() + ',X';

            case Instruction.AddressingMode.indexedIndirectX:
                return opcode + ' (' + read8() + ',X)';

            case Instruction.AddressingMode.zeroPageY:
                return opcode + ' ' + read8() + ',Y';

            case Instruction.AddressingMode.absoluteY:
                return opcode + ' ' + read16() + ',Y';

            case Instruction.AddressingMode.indirectIndexedY:
                return opcode + ' (' + read8() + '),Y';

            default:
                return 'INVALID';
        }
    }

    setMemory(memory: MemoryInterface): Disassembler {
        this.memory = memory;
        return this;
    }

    getMemory(): MemoryInterface {
        return this.memory;
    }
}

export = Disassembler;
