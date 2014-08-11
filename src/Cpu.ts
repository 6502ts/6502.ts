/// <reference path="./MemoryInterface.d.ts"/>

'use strict'

import Instruction = require('./Instruction');

function setFlagsNZ(state: Cpu.State, operand: number) {
    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z)) |
        (operand & 0x80) |
        (operand ? 0 : Cpu.Flags.z);
}

function opBoot(state: Cpu.State, memory: MemoryInterface): void {
    state.p = memory.readWord(0xFFFC);
}

function opNop(): void {}

function opAnd(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.a &= operand;
    setFlagsNZ(state, state.a);
}

function opClc(state: Cpu.State): void {
    state.flags &= ~Cpu.Flags.c;
}

function opCld(state: Cpu.State): void {
    state.flags &= ~Cpu.Flags.d;
}

function opCmp(state: Cpu.State, memory: MemoryInterface, operand: number): void {
     state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (state.a & 0x80) |
        (state.a === operand ? Cpu.Flags.z : 0) |
        (state.a >= operand ? Cpu.Flags.c : 0);
}

function opDex(state: Cpu.State): void {
    state.x = (state.x + 0xFF) % 0x100;
    setFlagsNZ(state, state.x);
}

function opDey(state: Cpu.State): void {
    state.y = (state.y + 0xFF) % 0x100;
    setFlagsNZ(state, state.y);
}

function opIny(state: Cpu.State): void {
    state.y = (state.y + 0x01) % 0x100;
    setFlagsNZ(state, state.y);
}

function opJmp(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.p = operand;
}

function opJsr(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    var returnPtr = (state.p + 0xFFFF) % 0x10000;

    memory.write(0x0100 + state.s, returnPtr >> 8);
    state.s = (state.s + 0xFF) % 0x100;
    memory.write(0x0100 + state.s, returnPtr & 0xFF);
    state.s = (state.s + 0xFF) % 0x100;

    state.p = operand;
}

function opLda(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.a = operand;
    setFlagsNZ(state, operand);
}

function opLdx(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.x = operand;
    setFlagsNZ(state, operand);
}

function opLdy(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.y = operand;
    setFlagsNZ(state, operand);
}

function opRts(state: Cpu.State, memory: MemoryInterface): void {
    var returnPtr: number;

    state.s = (state.s + 1) % 0x100;
    returnPtr = memory.read(0x0100 + state.s);
    state.s = (state.s + 1) % 0x100;
    returnPtr += (memory.read(0x0100 + state.s) << 8);

    state.p = (returnPtr + 1) % 0x10000;
}

function opSec(state: Cpu.State): void {
    state.flags |= Cpu.Flags.c;
}

function opSta(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    memory.write(operand, state.a);
}

function opStx(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    memory.write(operand, state.x);
}

function opSty(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    memory.write(operand, state.y);
}

function opTxs(state: Cpu.State): void {
    state.s = state.x;
}

function opTya(state: Cpu.State): void {
    state.a = state.y;
    setFlagsNZ(state, state.a);
}

class Cpu {
    constructor(private _memory: MemoryInterface) {
        this.reset();
    }

    setInterrupt(): Cpu {
        this._interruptPending = true;
        return this;
    }

    clearInterrupt(): Cpu {
        this._interruptPending = false;
        return this;
    }

    isInterrupt(): boolean {
        return this._interruptPending;
    }

    nmi(): Cpu {
        this._nmiPending = true;
        return this;
    }

    halt(): Cpu {
        this._halted = true;
        return this;
    }

    resume(): Cpu {
        this._halted = false;
        return this;
    }

    isHalt(): boolean {
        return this._halted;
    }

    setInvalidInstructionCallback(callback: Cpu.InvalidInstructionCallbackInterface): Cpu {
        this._invalidInstructionCallback = callback;
        return this;
    }

    getInvalidInstructionCallback(): Cpu.InvalidInstructionCallbackInterface {
        return this._invalidInstructionCallback;
    }

    reset(): Cpu {
        this.state.a = 0;
        this.state.x = 0;
        this.state.y = 0;
        this.state.s = 0;
        this.state.p = 0;
        this.state.flags = 0 | Cpu.Flags.i;

        this.executionState = Cpu.ExecutionState.boot;
        this._opCycles = 7;
        this._interruptPending = false;
        this._nmiPending = false;
        
        this._instructionCallback = opBoot;

        return this;
    }

    cycle(): Cpu {
        switch (this.executionState) {
            case Cpu.ExecutionState.boot:
            case Cpu.ExecutionState.execute:
                if (--this._opCycles === 0) {
                    this._instructionCallback(this.state, this._memory, this._operand);
                    this.executionState = Cpu.ExecutionState.fetch;
                }

                break;

            case Cpu.ExecutionState.fetch:
                if (this._halted) break;

                // TODO: interrupt handling

                this._fetch();
        }

        return this;
    }

    private _fetch() {
        var instruction = Instruction.opcodes[this._memory.read(this.state.p)],
            addressingMode = instruction.addressingMode,
            invalidInstructionHandler: Cpu.InstructionHandlerInterface,
            dereference = false,
            slowIndexedAccess = false;

        switch (instruction.operation) {
            case Instruction.Operation.and:
                this._opCycles = 0;
                this._instructionCallback = opAnd;
                dereference = true;
                break;

            case Instruction.Operation.bcc:
                if (this.state.flags & Cpu.Flags.c) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) % 0x10000;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                }
                break;
                
            case Instruction.Operation.beq:
                if (this.state.flags & Cpu.Flags.z) {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) % 0x10000;
                    this._opCycles = 1;
                }
                break;

            case Instruction.Operation.bne:
                if (this.state.flags & Cpu.Flags.z) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) % 0x10000;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                }
                break;

            case Instruction.Operation.bpl:
                if (this.state.flags & Cpu.Flags.n) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) % 0x10000;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                }
                break;

            case Instruction.Operation.clc:
                this._opCycles = 1;
                this._instructionCallback = opClc;
                break;

            case Instruction.Operation.cld:
                this._opCycles = 1;
                this._instructionCallback = opCld;
                break;

            case Instruction.Operation.cmp:
                this._opCycles = 0;
                this._instructionCallback = opCmp;
                dereference = true;
                break;

            case Instruction.Operation.dex:
                this._opCycles = 1;
                this._instructionCallback = opDex;
                break;

            case Instruction.Operation.dey:
                this._opCycles = 1;
                this._instructionCallback = opDey;
                break;

            case Instruction.Operation.iny:
                this._opCycles = 1;
                this._instructionCallback = opIny;
                break;

            case Instruction.Operation.jmp:
                this._opCycles = 0;
                this._instructionCallback = opJmp;
                break;

            case Instruction.Operation.jsr:
                this._opCycles = 3;
                this._instructionCallback = opJsr;
                break;

            case Instruction.Operation.lda:
                this._opCycles = 0;
                this._instructionCallback = opLda;
                dereference = true;
                break;

            case Instruction.Operation.ldx:
                this._opCycles = 0;
                this._instructionCallback = opLdx;
                dereference = true;
                break;

            case Instruction.Operation.ldy:
                this._opCycles = 0;
                this._instructionCallback = opLdy;
                dereference = true;
                break;

            case Instruction.Operation.nop:
                this._opCycles = 1;
                this._instructionCallback = opNop;
                break;

            case Instruction.Operation.sec:
                this._opCycles = 1;
                this._instructionCallback = opSec;
                break;

            case Instruction.Operation.rts:
                this._opCycles = 5;
                this._instructionCallback = opRts;
                break;

            case Instruction.Operation.sta:
                this._opCycles = 1;
                this._instructionCallback = opSta;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.stx:
                this._opCycles = 1;
                this._instructionCallback = opStx;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.sty:
                this._opCycles = 1;
                this._instructionCallback = opSty;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.txs:
                this._opCycles = 1;
                this._instructionCallback = opTxs;
                break;

            case Instruction.Operation.tya:
                this._opCycles = 1;
                this._instructionCallback = opTya;
                break;

            default:
                if (this._invalidInstructionCallback &&
                        (invalidInstructionHandler = this._invalidInstructionCallback(this.state)))
                {
                    addressingMode = invalidInstructionHandler.addressingMode;
                    this._opCycles = invalidInstructionHandler.cycles;
                    this._instructionCallback = invalidInstructionHandler.handler;
                    dereference = invalidInstructionHandler.dereference;
                } else {
                    addressingMode = Instruction.AddressingMode.invalid;
                    this._opCycles = 2;
                    this._instructionCallback = opNop;
                }
        }

        this.state.p = (this.state.p + 1) % 0x10000;

        var value: number;

        switch (addressingMode) {
            case Instruction.AddressingMode.immediate:
                this._operand = this._memory.read(this.state.p);
                dereference = false;
                this.state.p = (this.state.p + 1) % 0x10000;
                this._opCycles++;
                break;

            case Instruction.AddressingMode.zeroPage:
                this._operand = this._memory.read(this.state.p);
                this.state.p = (this.state.p + 1) % 0x10000;
                this._opCycles++;
                break;

            case Instruction.AddressingMode.absolute:
                this._operand = this._memory.readWord(this.state.p);
                this.state.p = (this.state.p + 2) % 0x10000;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.indirect:
                value = this._memory.readWord(this.state.p);
                if ((value & 0xFF) === 0xFF)
                    this._operand = this._memory.read(value) + (this._memory.read(value & 0xFF00) << 8);
                else this._operand = this._memory.readWord(value);
                this.state.p = (this.state.p + 2) % 0x10000;
                this._opCycles += 4;
                break;

            case Instruction.AddressingMode.relative:
                value = this._memory.read(this.state.p);
                value = (value & 0x80) ? -(~(value - 1) & 0xFF) : value;
                this._operand = (this.state.p + value + 0x10001) % 0x10000;
                this._opCycles += (((this._operand & 0xFF00) !== (this.state.p & 0xFF00)) ? 3 : 2);
                this.state.p = (this.state.p + 1) % 0x10000;
                break;

            case Instruction.AddressingMode.zeroPageX:
                this._operand = (this._memory.read(this.state.p) + this.state.x) % 0x100;
                this.state.p = (this.state.p + 1) % 0x10000;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.absoluteX:
                value = this._memory.readWord(this.state.p);
                this._operand = (value + this.state.x) % 0x10000;
                this._opCycles += ((slowIndexedAccess || (this._operand & 0xFF00) !== (value & 0xFF00)) ? 3 : 2)
                this.state.p = (this.state.p + 2) % 0x10000;
                break;

            case Instruction.AddressingMode.zeroPageY:
                this._operand = (this._memory.read(this.state.p) + this.state.y) % 0x100;
                this.state.p = (this.state.p + 1) % 0x10000;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.absoluteY:
                value = this._memory.readWord(this.state.p);
                this._operand = (value + this.state.y) % 0x10000;
                this._opCycles += ((slowIndexedAccess || (this._operand & 0xFF00) !== (value & 0xFF00)) ? 3 : 2);
                this.state.p = (this.state.p + 2) % 0x10000;
                break;

            case Instruction.AddressingMode.indexedIndirectX:
                value = (this._memory.read(this.state.p) + this.state.x) % 0x100;

                if (value === 0xFF) 
                    this._operand = this._memory.read(0xFF) + (this._memory.read(0x00) << 8);
                else this._operand = this._memory.readWord(value);

                this._opCycles += 4;
                this.state.p = (this.state.p + 1) % 0x10000;
                break;

            case Instruction.AddressingMode.indirectIndexedY:
                value = this._memory.read(this.state.p);

                if (value === 0xFF)
                    value = this._memory.read(0xFF) + (this._memory.read(0x00) << 8);
                else value = this._memory.readWord(value);

                this._operand = (value + this.state.y) % 0x10000;

                this._opCycles += ((slowIndexedAccess || (value & 0xFF00) !== (this._operand & 0xFF00)) ? 4 : 3);
                this.state.p = (this.state.p + 1) % 0x10000;
                break;
        }

        if (dereference) {
            this._operand = this._memory.read(this._operand);
            this._opCycles++;
        }

        this.executionState = Cpu.ExecutionState.execute;
    }

    executionState: Cpu.ExecutionState = Cpu.ExecutionState.boot;
    state: Cpu.State = new Cpu.State();
    
    private _opCycles: number = 0;
    private _instructionCallback: Cpu.InstructionCallbackInterface;
    private _invalidInstructionCallback : Cpu.InvalidInstructionCallbackInterface;
    private _interruptPending: boolean = false;
    private _nmiPending: boolean = false;
    private _halted: boolean = false;
    private _operand: number;
}

module Cpu {
    export enum ExecutionState {
        boot, fetch, execute
    }

    export class State {
        a: number = 0;
        x: number = 0;
        y: number = 0;
        s: number = 0;
        p: number = 0;
        flags: number = 0;
    }

    export interface InstructionHandlerInterface {
        cycles: number;
        addressingMode: Instruction.AddressingMode;
        handler: InstructionCallbackInterface;
        dereference: boolean;
    }

    export enum Flags {
        c = 0x01,
        z = 0x02,
        i = 0x04,
        d = 0x08,
        b = 0x10,
        e = 0x20,
        v = 0x40,
        n = 0x80
    }

    export interface InvalidInstructionCallbackInterface {
        (state?: Cpu.State): InstructionHandlerInterface
    }

    export interface InstructionCallbackInterface {
        (state?: Cpu.State, memory?: MemoryInterface, operand?: number): void;
    }
}

export = Cpu;
