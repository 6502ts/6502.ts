/// <reference path='./MemoryInterface.ts'/>

import Instruction = require('./Instruction');

class Disassembler {
    constructor(private memory: MemoryInterface)
    {}

    disassembleAt(address: number): string {
        var instruction = Instruction.encodings[this.memory.read(address)],
            opcode = Instruction.Opcode[instruction.opcode].toUpperCase();

        switch (instruction.addressingMode) {
            case Instruction.AddressingMode.implied:
                return opcode;

            case Instruction.AddressingMode.immediate:
                return '';

            default:
                return opcode;
        }
    }
}

export = Disassembler;
