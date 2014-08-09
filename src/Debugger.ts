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

    clearAllBreakpoints(): Debugger {
        for (var i = 0; i < 0x10000; i++) this._breakpoints[i] = 0;

        return this;
    }

    setBreakpoint(address: number, description: string = '-'): Debugger {
        address %= 0x10000;

        this._breakpoints[address] = 1;
        this._breakpointDescriptions[address] = description;

        return this;
    }

    clearBreakpoint(address: number): Debugger {
        this._breakpoints[address % 0x10000] = 0;

        return this;
    }

    dumpBreakpoints(): string {
        var result = '';

        for (var address = 0; address < 0x10000; address++) {
            if (this._breakpoints[address])
                result += (
                    hex.encode(address, 4) + ': ' +
                    this._breakpointDescriptions[address] + '\n')
        }

        return result.replace(/\n$/, '');
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
            result += (
                (this._breakpoints[address] ? '(B) ' : '    ') +
                hex.encode(address, 4) + ':   ' +
                this._disassembler.disassembleAt(address) + '\n'
            );

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

        this._executionInterrupted = false;

        var cycles = 0,
            timestamp = Date.now(),
            result = '';

        for (var i = 0; i < count; i++) {
            this._invalidInstuction = false;

            do {
                this._cpu.cycle();
                cycles++;
            } while (this._cpu.executionState === Cpu.ExecutionState.execute);

            if (this._invalidInstuction) {
                result += 'INVALID INSTRUCTION!\n';
                this._cpu.state.p = (this._cpu.state.p + 0xFFFF) % 0x10000;
                this._executionInterrupted = true;
                break;
            }

            if (this._breakpointsEnabled && this._breakpoints[this._cpu.state.p]) {
                result += ('BREAKPOINT: ' + this._breakpointDescriptions[this._cpu.state.p] + '\n');
                this._executionInterrupted = true;
                break;
            }
        }

        var time = Date.now() - timestamp;

        return result + 'Used ' + cycles + ' cycles in ' + time +
            ' milliseconds, now at\n' + this.disassembleAt(this._cpu.state.p, 1);
    }

    executionInterrupted(): boolean {
        return this._executionInterrupted;
    }

    setBreakpointsEnabled(breakpointsEnabled: boolean): Debugger {
        this._breakpointsEnabled = breakpointsEnabled;

        return this;
    }

    private _peek(address: number): number {
        return this._memory.peek(address % 0x10000);
    }

    private _poke(address: number, value: number) {
        this._memory.poke(address % 0x10000, value & 0xFF);
    }

    private _disassembler: Disassembler;

    private _invalidInstuction = false;

    private _breakpoints = new Uint8Array(0x10000);
    private _breakpointDescriptions: Array<String> = [];
    private _executionInterrupted = false;
    private _breakpointsEnabled = false;
};

export = Debugger;
