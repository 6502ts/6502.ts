'use strict';

var TRACE_SIZE = 1024;

import Instruction = require('./cpu/Instruction');
import Disassembler = require('./cpu/Disassembler');
import hex = require('../tools/hex');
import binary = require('../tools/binary');
import CpuInterface = require('./cpu/CpuInterface');
import BoardInterface = require('./board/BoardInterface');
import BusInterface = require('./bus/BusInterface');

class Debugger {
    constructor(
        private _bus: BusInterface,
        private _board: BoardInterface
    ) {
        this._disassembler = new Disassembler(this._bus);
        this._cpu = this._board.getCpu();
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
        block: Debugger.MemoryBlockInterface,
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

    trace(length: number = TRACE_SIZE): string {
        var result = '';
        length = Math.min(length, this._traceLength);

        for (var i = 0; i < length; i++) {
            result += (
                this.disassembleAt(
                    this._trace[(TRACE_SIZE + this._traceIndex - length + i) % TRACE_SIZE],
                    1
                ) + '\n');
        }

        return result + this.disassemble(1);
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

    setBreakpointsEnabled(breakpointsEnabled: boolean): Debugger {
        this._breakpointsEnabled = breakpointsEnabled;

        return this;
    }

    setTraceEnabled(traceEnabled: boolean): Debugger {
        this._traceEnabled = traceEnabled;

        return this;
    }

    private _cpuClockHandler() {
        if (this._traceEnabled) {
            this._trace[this._traceIndex] = this._cpu.getLastInstructionPointer();
            this._traceIndex = (this._traceIndex + 1) % TRACE_SIZE;
            if (this._traceLength < TRACE_SIZE) this._traceLength++;
        }

        if (this._breakpointsEnabled && this._breakpoints[this._cpu.state.p]) {
            this._board.triggerTrap(BoardInterface.TrapReason.debug);
        }
    }

    private _trapHandler(trap: BoardInterface.TrapPayload) {
        if (trap.reason === BoardInterface.TrapReason.cpu) {
            if (this._invalidInstuction) {
                this._cpu.state.p = (this._cpu.state.p + 0xFFFF) & 0xFFFF;
            }
        }
    }

    private _peek(address: number): number {
        return this._bus.peek(address % 0x10000);
    }

    private _poke(address: number, value: number) {
        this._bus.poke(address % 0x10000, value & 0xFF);
    }

    private _disassembler: Disassembler;
    private _cpu: CpuInterface;

    private _invalidInstuction = false;

    private _breakpoints = new Uint8Array(0x10000);
    private _breakpointDescriptions: Array<String> = [];
    private _breakpointsEnabled = false;
    private _traceEnabled = false;
    private _trace = new Uint16Array(TRACE_SIZE);
    private _traceLength = 0;
    private _traceIndex = 0;
};

module Debugger {
    export interface MemoryBlockInterface {
        [index: number]: number;
        length: number;
    }
};

export = Debugger;
