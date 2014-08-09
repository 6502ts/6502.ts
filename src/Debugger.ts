/// <reference path='./MemoryInterface.d.ts'/>

'use strict';

import Instruction = require('./Instruction');
import Disassembler = require('./Disassembler');
import hex = require('./hex');
import binary = require('./binary');
import Cpu = require('./Cpu');

class Debugger {
    constructor(
        private _memory: MemoryInterface,
        private _cpu: Cpu
    ) {
        this._disassembler = new Disassembler(this._memory);

        var invalidInstructionCallback = this._cpu.getInvalidInstructionCallback();
        this._cpu.setInvalidInstructionCallback(
            (state: Cpu.State): Cpu.InstructionHandlerInterface => {
                var handler: Cpu.InstructionHandlerInterface;
            
                if (invalidInstructionCallback && (handler = invalidInstructionCallback(state))) {
                    return handler;
                } else {
                    this._invalidInstuction = true;
                    return null;
                }
            }
        );
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

            instruction = Instruction.opcodes[this._peek(address)];
            result += (hex.encode(address, 4) + ':   ' +
                this._disassembler.disassembleAt(address) + '\n');

            i += instruction.getSize();
        }

        return result.replace(/\n$/, '');
    }

    disassemble(length: number): string {
        return this.disassembleAt(this._cpu.state.p, length);
    }

    dumpAt(start: number, length: number): string {
        var result = '',
            address: number;

        for (var i = 0; i < length; i++) {
            address = (start + i) % 0x10000;

            result += (hex.encode(address, 4) + ':   ' +
                hex.encode(this._peek(address), 2) + '\n')
        }

        return result.replace(/\n$/, '');
    }

    dumpState(): string {
        var state = this._cpu.state,
            result = '' +
                'A = ' + hex.encode(state.a, 2) + '   ' +
                'X = ' + hex.encode(state.x, 2) + '   ' +
                'Y = ' + hex.encode(state.y, 2) + '   ' +
                'S = ' + hex.encode(state.s, 2) + '   ' +
                'P = ' + hex.encode(state.p, 4) + '\n' +
                'flags = ' + binary.encode(state.flags, 8);
        
        return result;
    }

    dumpStack(): string {
        return this.dumpAt(0x0100 + this._cpu.state.s, 0x100 - this._cpu.state.s);
    }

    boot(): string {
        var cycles = 0;

        this._cpu.reset();
        while (this._cpu.executionState !== Cpu.ExecutionState.fetch) {
            this._cpu.cycle();
            cycles++;
        }

        return 'Boot successful in ' + cycles + ' cycles';
    }

    step(count: number = 1): string {
        if (this._cpu.executionState !== Cpu.ExecutionState.fetch)
            throw new Error('must boot first');

        var cycles = 0,
            timestamp = Date.now();

        for (var i = 0; i < count; i++) {
            this._invalidInstuction = false;

            do {
                this._cpu.cycle();
                cycles++;
            } while (this._cpu.executionState === Cpu.ExecutionState.execute);

            if (this._invalidInstuction) {
                this._cpu.state.p = (this._cpu.state.p + 0xFFFF) % 0x10000;
                throw new Error('invalid instruction');
            }
        }

        var time = Date.now() - timestamp;

        return 'Used ' + cycles + ' cycles in ' + time +
            ' milliseconds, now at\n' + this.disassembleAt(this._cpu.state.p, 1);
    }

    private _peek(address: number): number {
        return this._memory.peek(address % 0x10000);
    }

    private _poke(address: number, value: number) {
        this._memory.poke(address % 0x10000, value & 0xFF);
    }

    private _disassembler: Disassembler;

    private _invalidInstuction = false;
};

export = Debugger;
