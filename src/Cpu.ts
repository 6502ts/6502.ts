/// <reference path="./MemoryInterface.d.ts"/>

import Instruction = require('./Instruction');

function opBoot(state: Cpu.State, memory: MemoryInterface): void {
    state.p = memory.readWord(0xFFFC);
}

function opNop(): void {}

function opClc(state: Cpu.State): void {
    state.flags &= ~Cpu.Flags.c;
}

function opSec(state: Cpu.State): void {
    state.flags |= Cpu.Flags.c;
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
        this._halted = true;
        return this;
    }

    isHalt(): boolean {
        return this._halted;
    }

    setInvalidOpcodeCallback(callback: Cpu.InvalidOpcodeCallbackInterface): Cpu {
        this._invalidOpcodeCallback = callback;
        return this;
    }

    getInvalidOpcodeHandler(): Cpu.InvalidOpcodeCallbackInterface {
        return this._invalidOpcodeCallback;
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
        var instruction = instruction.encodings(this._memory, this.state.p),
            addressingMode = instruction.addressingMode,
            invalidOpcodeHandler: Cpu.InstructionHandlerInterface,
            dereference = false;

        switch (instruction.opcode) {
            case Instruction.Opcode.clc:
                this._opCycles = 2;
                this._instructonCallback = opClc;
                break;

            case Instruction.Opcode.nop:
                this._opCycles = 2;
                this._instructonCallback = opNop;
                break;

            case Instruction.Opcode.sec:
                this._opCycles = 2;
                this._instructonCallback = opSec;
                break;

            default:
                if (this._invalidOpcodeCallback &&
                        (invalidOpcodeHandler = this._invalidOpcodeCallback(this.state)))
                {
                    addressingMode = invalidOpcodeHandler.addressingMode;
                    this._opCycles = invalidOpcodeHandler.cycles;
                    this._instructonCallback = invalidOpcodeHandler.handler;
                    dereference = invalidOpcodeHandler.dereference;
                } else {
                    addressingMode = Instruction.AddressingMode.invalid;
                    this._opCycles = 2;
                    this._instructonCallback = opNop;
                }
        }

        this.state.p = (this.state.p + 1) % 0x10000;

        var decoded: number,
            value: number;

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
                decoded = (value & 0x80) ? -(~(value - 1) & 0xFF) : value;
                this._operand = (this.state.p + value + 0x10001) % 0x10000;
                this._opCycles += (((this._operand & 0xFF00) !== (this.state.p & 0xFF00)) ? 3 : 2);
                this.state.p = (this.state.p + 1) % 0x10000;
                break;

            case Instruction.AddressingMode.zeroPageX:
                this._operand = this._memory.read(this.state.p) + this.state.x;
                this.state.p = (this.state.p + 1) % 0x10000;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.absoluteX:
                value = this._memory.readWord(this.state.p);
                this._operand = (value + this.state.x) % 0x10000;
                this._opCycles += (((this._operand & 0xFF00) !== (value & 0xFF00)) ? 3 : 2)
                this.state.p = (this.state.p + 2) % 0x10000;
                break;

            default:
                // TODO: transition, remove once address decoding is complete
                this.state.p += instruction.getSize();
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
    private _invalidOpcodeCallback : Cpu.InvalidOpcodeCallbackInterface;
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
        c = 1 << 0,
        z = 1 << 1,
        i = 1 << 2,
        d = 1 << 3,
        b = 1 << 4,
        e = 1 << 5,
        v = 1 << 6,
        n = 1 << 7       
    }

    export interface InvalidOpcodeCallbackInterface {
        (state?: Cpu.State): InstructionHandlerInterface
    }

    export interface InstructionCallbackInterface {
        (state?: Cpu.State, memory?: MemoryInterface, operand?: number): void;
    }
}
