/// <reference path='./MemoryInterface.ts'/>

'use strict';

import Instruction = require('./Instruction');
import Disassembler = require('./Disassembler');
import hex = require('./hex');

class Debugger {
    constructor(private _memory: MemoryInterface) {
        this._disassembler = new Disassembler(this._memory);
    }

    loadBlock(
        block: MemoryBlockInterface,
        at: number,
        from: number = 0,
        to: number = block.length - 1
    ) {
        var address: number;

        for (var i = 0; i <= to - from; i++)
            this._poke(at + i, block[i]);
    }

    disassembleAt(start: number, length: number): string {
        var i = 0,
            result = '',
            instruction: Instruction,
            address: number;

        while (i < length) {
            address = (start + i) % 0x10000;

            instruction = Instruction.encodings[this._peek(address)];
            result += (hex.encode(address, 4) + ':   ' +
                this._disassembler.disassembleAt(address) + '\n');

            i += instruction.getSize();
        }

        return result;
    }

    dumpAt(start: number, length: number) {
        var result = '',
            address: number;

        for (var i = 0; i < length; i++) {
            address = (start + i) % 0x10000;

            result += (hex.encode(address, 4) + ':   ' +
                hex.encode(this._peek(address), 2) + '\n')
        }

        return result;
    }

    private _peek(address: number): number {
        return this._memory.peek(address % 0x10000);
    }

    private _poke(address: number, value: number) {
        this._memory.poke(address % 0x10000, value & 0xFF);
    }

    private _disassembler: Disassembler;
};

export = Debugger;
