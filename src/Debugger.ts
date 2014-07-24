/// <reference path='./MemoryInterface.ts'/>

import Instruction = require('./Instruction');
import Disassembler = require('./Disassembler');
import hex = require('./hex');

class Memory implements MemoryInterface {
    constructor() {
        for (var i = 0; i < 0x10000; i++) this._data[i] = 0;
    }

    read(address: number): number {
        return this._data[address % 0x10000];
    }

    write(address: number, value: number) {
        this._data[address % 0x10000] = value & 0xFF;
    }

    loadBlock(
        block: Debugger.MemoryBlockInterface,
        at: number,
        from: number = 0,
        to: number = block.length - 1
    ) {
        for (var i = 0; i <= to - from; i++)
            this._data[(at + i) % 0x10000] = block[from + i] & 0xFF;
    }

    private _data = new Uint8Array(0x10000);
}

class Debugger {
    constructor() {
        this._memory = new Memory();
        this._disassembler = new Disassembler(this._memory);
    }

    loadBlock(
        block: Debugger.MemoryBlockInterface,
        at: number,
        from: number = 0,
        to: number = block.length - 1
    ) {
        this._memory.loadBlock(block, at, from, to);
    }

    disassembleAt(start: number, length: number): string {
        var i = 0,
            result = '',
            instruction: Instruction,
            address: number;

        while (i < length) {
            address = (start + i) % 0x10000;

            instruction = Instruction.encodings[this._memory.read(address)];
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
                hex.encode(this._memory.read(address), 2) + '\n')
        }

        return result;
    }

    private _memory: Memory;
    private _disassembler: Disassembler;
};

module Debugger {
    export interface MemoryBlockInterface {
        [index: number]: number;
        length: number;
    }
}

export = Debugger;
