/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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

import Instruction from './cpu/Instruction';
import Disassembler from './cpu/Disassembler';
import CpuInterface from './cpu/CpuInterface';
import BoardInterface from './board/BoardInterface';
import BusInterface from './bus/BusInterface';

import * as hex from '../tools/hex';
import * as binary from '../tools/binary';
import * as util from 'util';

class Debugger {

    constructor(private _traceSize: number = 2048, private _stepMaxCycles = 10000000) {}

    attach(board: BoardInterface): Debugger {
        this._board = board;
        this._bus = this._board.getBus();
        this._cpu = this._board.getCpu();
        this._disassembler = new Disassembler(this._bus);

        this._board.trap.addHandler(this._trapHandler, this);

        this._traceLength = 0;
        this._traceIndex = 0;

        return this;
    }

    detach(): Debugger {
        if (!this._board) {
            return;
        }

        this._board.cpuClock.removeHandler(this._cpuClockHandler);
        this._board.trap.removeHandler(this._trapHandler);

        return this;
    }

    clearAllBreakpoints(): Debugger {
        for (let i = 0; i < 0x10000; i++) {
            this._breakpoints[i] = 0;
        }

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
        let result = '';

        for (let address = 0; address < 0x10000; address++) {
            if (this._breakpoints[address]) {
                result += (
                    hex.encode(address, 4) + ': ' +
                    this._breakpointDescriptions[address] + '\n');
            }
        }

        return result.replace(/\n$/, '');
    }

    loadBlock(
        block: Debugger.MemoryBlockInterface,
        at: number,
        from: number = 0,
        to: number = block.length - 1
    ) {
        for (let i = 0; i <= to - from; i++) {
            this._poke(at + i, block[i]);
        }
    }

    disassembleAt(start: number, length: number): string {
        let i = 0,
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

    trace(length: number = this._traceSize): string {
        let result = '';
        length = Math.min(length, this._traceLength);

        for (let i = 0; i < length; i++) {
            result += (
                this.disassembleAt(
                    this._trace[(this._traceSize + this._traceIndex - length + i) % this._traceSize],
                    1
                ) + '\n');
        }

        return result + this.disassemble(1);
    }

    dumpAt(start: number, length: number): string {
        let result = '',
            address: number;

        for (let i = 0; i < length; i++) {
            address = (start + i) % 0x10000;

            result += (hex.encode(address, 4) + ':   ' +
                hex.encode(this._peek(address), 2) + '\n');
        }

        return result.replace(/\n$/, '');
    }

    dumpState(): string {
        const state = this._cpu.state;

        switch (this._cpu.executionState) {
            case CpuInterface.ExecutionState.boot:
        }

        let result = '' +
                'A = ' + hex.encode(state.a, 2) + '   ' +
                'X = ' + hex.encode(state.x, 2) + '   ' +
                'Y = ' + hex.encode(state.y, 2) + '   ' +
                'S = ' + hex.encode(state.s, 2) + '   ' +
                'P = ' + hex.encode(state.p, 4) + '\n' +
                'flags = ' + binary.encode(state.flags, 8) + '\n' +
                'state: ' + this._humanReadableExecutionState();

        const boardState = this._board.getBoardStateDebug();

        if (boardState) {
            result += (
                '\n' +
                '\n' +
                boardState
            );
        }

        return result;
    }

    dumpStack(): string {
        return this.dumpAt(0x0100 + this._cpu.state.s, 0x100 - this._cpu.state.s);
    }

    step(instructions: number): {cycles: number, cpuCycles: number} {
        let instruction = 0,
            cycles = 0,
            lastExecutionState = this._cpu.executionState,
            cpuCycles = 0;
        const timer = this._board.getTimer();

        const cpuClockHandler = (c: number) => cpuCycles += c;
        this._board.cpuClock.addHandler(cpuClockHandler);

        this._lastTrap = undefined;

        this._board.resume();

        while (instruction < instructions && !this._lastTrap && cycles < this._stepMaxCycles) {
            timer.tick(1);
            cycles++;

            if (lastExecutionState !== this._cpu.executionState) {
                lastExecutionState = this._cpu.executionState;

                if (lastExecutionState === CpuInterface.ExecutionState.fetch) {
                    instruction++;
                }
            }
        }

        this._board.cpuClock.removeHandler(cpuClockHandler);
        this._board.suspend();

        return {cycles, cpuCycles};
    }

    stepClock(cycles: number): number {
        this._lastTrap = undefined;

        this._board.resume();

        const usedCycles = this._board.getTimer().tick(cycles);

        this._board.suspend();

        return usedCycles;
    }

    setBreakpointsEnabled(breakpointsEnabled: boolean): Debugger {
        this._breakpointsEnabled = breakpointsEnabled;

        this._attachToCpuIfNecessary();

        return this;
    }

    setTraceEnabled(traceEnabled: boolean): Debugger {
        this._traceEnabled = traceEnabled;

        this._attachToCpuIfNecessary();

        return this;
    }

    getBoard(): BoardInterface {
        return this._board;
    }

    getLastTrap(): BoardInterface.TrapPayload {
        return this._lastTrap;
    }

    private _humanReadableExecutionState() {
        if (this._cpu.isHalt()) {
            return 'halted';
        }

        switch (this._cpu.executionState) {
            case CpuInterface.ExecutionState.boot:
                return 'boot';

            case CpuInterface.ExecutionState.fetch:
                return 'fetch';

            case CpuInterface.ExecutionState.execute:
                return 'execute';
        }
    }

    private _attachToCpuIfNecessary(): void {
        if (this._traceEnabled || this._breakpointsEnabled) {
            this._lastInstructionPointer = this._cpu.getLastInstructionPointer() || 0;
            this._board.cpuClock.addHandler(this._cpuClockHandler, this);
            this._board.setClockMode(BoardInterface.ClockMode.instruction);
        } else {
            this._board.cpuClock.removeHandler(this._cpuClockHandler, this);
            this._board.setClockMode(BoardInterface.ClockMode.lazy);
        }
    }

    private _cpuClockHandler(clocks: number, ctx: Debugger): void {
        const lastInstructionPointer = ctx._cpu.getLastInstructionPointer();

        if (ctx._cpu.executionState !== CpuInterface.ExecutionState.fetch ||
            lastInstructionPointer === ctx._lastInstructionPointer
        ) {
            return;
        }

        ctx._lastInstructionPointer = lastInstructionPointer;

        if (ctx._traceEnabled) {
            ctx._trace[ctx._traceIndex] = lastInstructionPointer;
            ctx._traceIndex = (ctx._traceIndex + 1) % ctx._traceSize;
            if (ctx._traceLength < ctx._traceSize) {
                ctx._traceLength++;
            }
        }

        if (ctx._breakpointsEnabled && ctx._breakpoints[ctx._cpu.state.p]) {
            ctx._board.triggerTrap(BoardInterface.TrapReason.debug,
                util.format('breakpoint "%s" at %s',
                    ctx._breakpointDescriptions[ctx._cpu.state.p] || '',
                    hex.encode(ctx._cpu.state.p)
                )
            );
        }
    }

    private _trapHandler(trap: BoardInterface.TrapPayload, dbg: Debugger): void {
        dbg._lastTrap = trap;
    }

    private _peek(address: number): number {
        return this._bus.peek(address % 0x10000);
    }

    private _poke(address: number, value: number) {
        this._bus.poke(address % 0x10000, value & 0xFF);
    }

    private _disassembler: Disassembler;
    private _cpu: CpuInterface;
    private _bus: BusInterface;
    private _board: BoardInterface;

    private _breakpoints = new Uint8Array(0x10000);
    private _breakpointDescriptions: Array<string> = new Array(0x10000);
    private _breakpointsEnabled = false;

    private _traceEnabled = false;
    private _trace = new Uint16Array(this._traceSize);
    private _traceLength = 0;
    private _traceIndex = 0;
    private _lastInstructionPointer: number;

    private _lastTrap: BoardInterface.TrapPayload;
}

namespace Debugger {
    export interface MemoryBlockInterface {
        [index: number]: number;
        length: number;
    }
}

export default Debugger;
