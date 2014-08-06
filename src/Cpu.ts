/// <reference path="./MemoryInterface.d.ts"/>

import Instruction = require('./Instruction');

function opBoot(state: Cpu.State, memory: MemoryInterface): void {
    state.p = memory.readWord(0xFFFC);
}

function opNop(): void {}

function opClc(state: Cpu.State): void {
    state.flags &= ~Cpu.Flags.c;
}

function opCld(state: Cpu.State): void {
    state.flags &= ~Cpu.Flags.d;
}

function opLdx(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.x = operand;
}

function opLdy(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.y = operand;
}

function opSec(state: Cpu.State): void {
    state.flags |= Cpu.Flags.c;
}

function opTxs(state: Cpu.State): void {
    state.s = state.x;
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

    setInvalidOperationCallback(callback: Cpu.InvalidOperationCallbackInterface): Cpu {
        this._invalidOperationCallback = callback;
        return this;
    }

    getInvalidOperationCallback(): Cpu.InvalidOperationCallbackInterface {
        return this._invalidOperationCallback;
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
        
        this._instructonCallback = opBoot;

        return this;
    }

    cycle(): Cpu {
        switch (this.executionState) {
            case Cpu.ExecutionState.boot:
            case Cpu.ExecutionState.execute:
                if (--this._opCycles === 0) {
                    this._instructonCallback(this.state, this._memory, this._operand);
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
            invalidOperationHandler: Cpu.InstructionHandlerInterface,
            dereference = false,
            slowIndexedAccess = false;

        switch (instruction.operation) {
            case Instruction.Operation.clc:
                this._opCycles = 1;
                this._instructonCallback = opClc;
                break;

            case Instruction.Operation.cld:
                this._opCycles = 1;
                this._instructonCallback = opCld;
                break;

            case Instruction.Operation.nop:
                this._opCycles = 1;
                this._instructonCallback = opNop;
                break;

            case Instruction.Operation.ldx:
                this._opCycles = 0;
                this._instructonCallback = opLdx;
                dereference = true;
                break;

            case Instruction.Operation.ldy:
                this._opCycles = 0;
                this._instructonCallback = opLdy;
                dereference = true;
                break;

            case Instruction.Operation.sec:
                this._opCycles = 1;
                this._instructonCallback = opSec;
                break;

            case Instruction.Operation.txs:
                this._opCycles = 1;
                this._instructonCallback = opTxs;
                break;

            default:
                if (this._invalidOperationCallback &&
                        (invalidOperationHandler = this._invalidOperationCallback(this.state)))
                {
                    addressingMode = invalidOperationHandler.addressingMode;
                    this._opCycles = invalidOperationHandler.cycles;
                    this._instructonCallback = invalidOperationHandler.handler;
                    dereference = invalidOperationHandler.dereference;
                } else {
                    addressingMode = Instruction.AddressingMode.invalid;
                    this._opCycles = 2;
                    this._instructonCallback = opNop;
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
                    this._operand = this._memory.read(value) + this._memory.read(value & 0xFF00) << 8;
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
                this._opCycles += ((slowIndexedAccess || (this._operand & 0xFF00) !== (value % 0xFF00)) ? 3 : 2);
                this.state.p = (this.state.p + 1) % 0x10000;
                break;

            case Instruction.AddressingMode.indexedIndirectX:
                value = (this._memory.read(this.state.p) + this.state.x) % 0x100;

                if (value === 0xFF) 
                    this._operand = this._memory.read(0xFF) + this._memory.read(0x00) << 8;
                else this._operand = this._memory.readWord(value);

                this._opCycles += 4;
                this.state.p = (this.state.p + 1) % 0x10000;
                break;

            case Instruction.AddressingMode.indirectIndexedY:
                value = this._memory.read(this.state.p);

                if (value === 0xFF)
                    value = this._memory.read(0xFF) + this._memory.read(0x00) << 8;
                else value = this._memory.readWord(value);

                this._operand = (value + this.state.y) % 0x10000;

                this._opCycles = ((slowIndexedAccess || (value & 0xFF00) !== (this._operand & 0xFF)) ? 4 : 3);
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
    private _instructonCallback: Cpu.InstructionCallbackInterface;
    private _invalidOperationCallback : Cpu.InvalidOperationCallbackInterface;
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

    export interface InvalidOperationCallbackInterface {
        (state?: Cpu.State): InstructionHandlerInterface
    }

    export interface InstructionCallbackInterface {
        (state?: Cpu.State, memory?: MemoryInterface, operand?: number): void;
    }
}

export = Cpu;
