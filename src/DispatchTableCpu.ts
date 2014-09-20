/// <reference path="./MemoryInterface.d.ts"/>

'use strict'

import Instruction = require('./Instruction');

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

    getLastInstructionPointer(): number {
        return this._lastInstructionPointer;
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
        var instruction = compiledInstructions[this._memory.read(this.state.p)];

        this._lastInstructionPointer = this.state.p;
        this.state.p = (this.state.p + 1) & 0xFFFF;
        instruction.decode(instruction, this._memory, this.state);

        this._instructionCallback = instruction.callback;
        this._operand = instruction.operand;
        this._opCycles = instruction.cycles;

        if (!instruction.valid && this._invalidInstructionCallback)
            this._invalidInstructionCallback();

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
    private _lastInstructionPointer: number;
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
        (cpu?: Cpu): void
    }

    export interface InstructionCallbackInterface {
        (state?: Cpu.State, memory?: MemoryInterface, operand?: number): void;
    }
}

export = Cpu;

function setFlagsNZ(state: Cpu.State, operand: number): void {
    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z)) |
        (operand & 0x80) |
        (operand ? 0 : Cpu.Flags.z);
}

function opBoot(state: Cpu.State, memory: MemoryInterface): void {
    state.p = memory.readWord(0xFFFC);
}

function opAdc(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    if (state.flags & Cpu.Flags.d) {
        var d0 = (operand & 0x0F) + (state.a & 0x0F) + (state.flags & Cpu.Flags.c),
            d1 = (operand >>> 4) + (state.a >>> 4) + (d0 > 9 ? 1 : 0);

        state.a = (d0 % 10) | ((d1 % 10) << 4);

        state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
            (state.a & 0x80) |  // negative
            (state.a ? 0 : Cpu.Flags.z) |   // zero
            (d1 > 9 ? Cpu.Flags.c : 0);     // carry
    } else {
        var sum = state.a + operand + (state.flags & Cpu.Flags.c),
            result = sum & 0xFF;

        state.flags =
            (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c | Cpu.Flags.v)) |
            (result & 0x80) |  // negative
            (result ? 0 : Cpu.Flags.z) |   // zero
            (sum >>> 8) |         // carry
            (((~(operand ^ state.a) & (result ^ operand)) & 0x80) >>> 1); // overflow

        state.a = result;
    }
}

function opAnd(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.a &= operand;
    setFlagsNZ(state, state.a);
}

function opAslAcc(state: Cpu.State): void {
    var old = state.a;
    state.a = (state.a << 1) & 0xFF;

    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : Cpu.Flags.z) |
        (old >>> 7);
}

function opAslMem(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    var old = memory.read(operand),
        value = (old << 1) & 0xFF;
    memory.write(operand, value);

    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : Cpu.Flags.z) |
        (old >>> 7);
}

function opBit(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.flags =
        (state.flags & ~(Cpu.Flags.n | Cpu.Flags.v | Cpu.Flags.z)) |
        (operand & (Cpu.Flags.n | Cpu.Flags.v)) |
        ((operand & state.a) ? 0 : Cpu.Flags.z);
}

function opClc(state: Cpu.State): void {
    state.flags &= ~Cpu.Flags.c;
}

function opCld(state: Cpu.State): void {
    state.flags &= ~Cpu.Flags.d;
}

function opCli(state: Cpu.State): void {
    state.flags &= ~Cpu.Flags.i;
}

function opClv(state: Cpu.State): void {
    state.flags &= ~Cpu.Flags.v;
}

function opCmp(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    var diff = state.a + (~operand & 0xFF) + 1;

     state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (diff & 0x80) |
        ((diff & 0xFF) ? 0 : Cpu.Flags.z) |
        (diff >>> 8);
}

function opCpx(state: Cpu.State, memory: MemoryInterface, operand: number): void {
     var diff = state.x + (~operand & 0xFF) + 1;

     state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (diff & 0x80) |
        ((diff & 0xFF) ? 0 : Cpu.Flags.z) |
        (diff >>> 8);
}

function opCpy(state: Cpu.State, memory: MemoryInterface, operand: number): void {
     var diff = state.y + (~operand & 0xFF) + 1;

     state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (diff & 0x80) |
        ((diff & 0xFF) ? 0 : Cpu.Flags.z) |
        (diff >>> 8);
}

function opDec(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    var value = (memory.read(operand) + 0xFF) & 0xFF;
    memory.write(operand, value);
    setFlagsNZ(state, value);
}

function opDex(state: Cpu.State): void {
    state.x = (state.x + 0xFF) & 0xFF;
    setFlagsNZ(state, state.x);
}

function opEor(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.a = state.a ^ operand;
    setFlagsNZ(state, state.a);
}

function opDey(state: Cpu.State): void {
    state.y = (state.y + 0xFF) & 0xFF;
    setFlagsNZ(state, state.y);
}

function opInc(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    var value = (memory.read(operand) + 1) & 0xFF;
    memory.write(operand, value);
    setFlagsNZ(state, value);
}

function opInx(state: Cpu.State): void {
    state.x = (state.x + 0x01) & 0xFF;
    setFlagsNZ(state, state.x);
}

function opIny(state: Cpu.State): void {
    state.y = (state.y + 0x01) & 0xFF;
    setFlagsNZ(state, state.y);
}

function opJmp(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.p = operand;
}

function opJsr(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    var returnPtr = (state.p + 0xFFFF) & 0xFFFF;

    memory.write(0x0100 + state.s, returnPtr >>> 8);
    state.s = (state.s + 0xFF) & 0xFF;
    memory.write(0x0100 + state.s, returnPtr & 0xFF);
    state.s = (state.s + 0xFF) & 0xFF;

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

function opLsrAcc(state: Cpu.State): void {
    var old = state.a;
    state.a = state.a >>> 1;

    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : Cpu.Flags.z) |
        (old & Cpu.Flags.c);
}

function opLsrMem(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    var old = memory.read(operand),
        value = old >>> 1;
    memory.write(operand, value);

    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : Cpu.Flags.z) |
        (old & Cpu.Flags.c);
}

function opNop(): void {}

function opOra(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    state.a |= operand;
    setFlagsNZ(state, state.a);
}

function opPhp(state: Cpu.State, memory: MemoryInterface): void {
    memory.write(0x0100 + state.s, state.flags);
    state.s = (state.s + 0xFF) & 0xFF;
}

function opPlp(state: Cpu.State, memory: MemoryInterface): void {
    var mask = Cpu.Flags.b | Cpu.Flags.e;

    state.s = (state.s + 0x01) & 0xFF;
    state.flags = (state.flags & mask) | (memory.read(0x0100 + state.s) & ~mask);
}

function opPha(state: Cpu.State, memory: MemoryInterface): void {
    memory.write(0x0100 + state.s, state.a);
    state.s = (state.s + 0xFF) & 0xFF;
}

function opPla(state: Cpu.State, memory: MemoryInterface): void {
    state.s = (state.s + 0x01) & 0xFF;
    state.a = memory.read(0x0100 + state.s);
    setFlagsNZ(state, state.a);
}

function opRolAcc(state: Cpu.State): void {
    var old = state.a;
    state.a = ((state.a << 1) & 0xFF) | (state.flags & Cpu.Flags.c);

    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : Cpu.Flags.z) |
        (old >>> 7);
}

function opRolMem(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    var old = memory.read(operand),
        value = ((old << 1) & 0xFF) | (state.flags & Cpu.Flags.c);
    memory.write(operand, value);

    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : Cpu.Flags.z) |
        (old >>> 7);
}

function opRorAcc(state: Cpu.State): void {
    var old = state.a;
    state.a = (state.a >>> 1) | ((state.flags & Cpu.Flags.c) << 7);

    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : Cpu.Flags.z) |
        (old & Cpu.Flags.c);
}

function opRorMem(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    var old = memory.read(operand),
        value = (old >>> 1) | ((state.flags & Cpu.Flags.c) << 7);
    memory.write(operand, value);

    state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : Cpu.Flags.z) |
        (old & Cpu.Flags.c);
}

function opRts(state: Cpu.State, memory: MemoryInterface): void {
    var returnPtr: number;

    state.s = (state.s + 1) & 0xFF;
    returnPtr = memory.read(0x0100 + state.s);
    state.s = (state.s + 1) & 0xFF;
    returnPtr += (memory.read(0x0100 + state.s) << 8);

    state.p = (returnPtr + 1) & 0xFFFF;
}

function opSbc(state: Cpu.State, memory: MemoryInterface, operand: number): void {
    if (state.flags & Cpu.Flags.d) {
        var d0 = ((state.a & 0x0F) - (operand & 0x0F) - (~state.flags & Cpu.Flags.c)) % 10,
            d1 = ((state.a >>> 4) - (operand >>> 4) - (d0 < 0 ? 1 : 0)) % 10;

        state.a = (d0 < 0 ? 10 + d0 : d0) | ((d1 < 0 ? 10 + d1 : d1) << 4);

        state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c)) |
            (state.a & 0x80) |  // negative
            (state.a ? 0 : Cpu.Flags.z) |   // zero
            (d1 < 0 ? 0 : Cpu.Flags.c);     // carry / borrow
    } else {
        operand = (~operand & 0xFF);

        var sum = state.a + operand + (state.flags & Cpu.Flags.c),
            result = sum & 0xFF;

        state.flags = (state.flags & ~(Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.c | Cpu.Flags.v)) |
            (result & 0x80) |  // negative
            (result ? 0 : Cpu.Flags.z) |   // zero
            (sum >>> 8) |         // carry / borrow
            (((~(operand ^ state.a) & (result ^ operand)) & 0x80) >>> 1); // overflow

        state.a = result;
    }
}

function opSec(state: Cpu.State): void {
    state.flags |= Cpu.Flags.c;
}

function opSed(state: Cpu.State): void {
    state.flags |= Cpu.Flags.d;
}

function opSei(state: Cpu.State): void {
    state.flags |= Cpu.Flags.i;
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

function opTax(state: Cpu.State): void {
    state.x = state.a;
    setFlagsNZ(state, state.a);
}

function opTay(state: Cpu.State): void {
    state.y = state.a;
    setFlagsNZ(state, state.a);
}

function opTsx(state: Cpu.State): void {
    state.x = state.s;
    setFlagsNZ(state, state.x);
}

function opTxa(state: Cpu.State): void {
    state.a = state.x;
    setFlagsNZ(state, state.a);
}

function opTxs(state: Cpu.State): void {
    state.s = state.x;
}

function opTya(state: Cpu.State): void {
    state.a = state.y;
    setFlagsNZ(state, state.a);
}

class CompiledInstruction {
    constructor(public instruction: Instruction) {
        this.addressingMode = instruction.addressingMode;
    }

    callback: Cpu.InstructionCallbackInterface;
    decode: (instruction: CompiledInstruction,
        memory: MemoryInterface, state: Cpu.State) => void;

    addressingMode: Instruction.AddressingMode;
    slowIndexedAccess = false;
    operand: number;
    dereference = false;
    cycles: number;
    valid = true;
}

function decodeOperand(instruction: CompiledInstruction, memory: MemoryInterface,
    state: Cpu.State)
{
    var value: number,
        dereference = instruction.dereference;

    switch (instruction.addressingMode) {
        case Instruction.AddressingMode.immediate:
            instruction.operand = memory.read(state.p);
            dereference = false;
            state.p = (state.p + 1) & 0xFFFF;
            instruction.cycles++;
            break;

        case Instruction.AddressingMode.zeroPage:
            instruction.operand = memory.read(state.p);
            state.p = (state.p + 1) & 0xFFFF;
            instruction.cycles++;
            break;

        case Instruction.AddressingMode.absolute:
            instruction.operand = memory.readWord(state.p);
            state.p = (state.p + 2) & 0xFFFF;
            instruction.cycles += 2;
            break;

        case Instruction.AddressingMode.indirect:
            value = memory.readWord(state.p);
            if ((value & 0xFF) === 0xFF)
                instruction.operand = memory.read(value) + (memory.read(value & 0xFF00) << 8);
            else instruction.operand = memory.readWord(value);
            state.p = (state.p + 2) & 0xFFFF;
            instruction.cycles += 4;
            break;

        case Instruction.AddressingMode.relative:
            value = memory.read(state.p);
            value = (value & 0x80) ? -(~(value - 1) & 0xFF) : value;
            instruction.operand = (state.p + value + 0x10001) & 0xFFFF;
            instruction.cycles += (((instruction.operand & 0xFF00) !== (state.p & 0xFF00)) ? 3 : 2);
            state.p = (state.p + 1) & 0xFFFF;
            break;

        case Instruction.AddressingMode.zeroPageX:
            instruction.operand = (memory.read(state.p) + state.x) & 0xFF;
            state.p = (state.p + 1) & 0xFFFF;
            instruction.cycles += 2;
            break;

        case Instruction.AddressingMode.absoluteX:
            value = memory.readWord(state.p);
            instruction.operand = (value + state.x) & 0xFFFF;
            instruction.cycles += ((instruction.slowIndexedAccess || (instruction.operand & 0xFF00) !== (value & 0xFF00)) ? 3 : 2)
            state.p = (state.p + 2) & 0xFFFF;
            break;

        case Instruction.AddressingMode.zeroPageY:
            instruction.operand = (memory.read(state.p) + state.y) & 0xFF;
            state.p = (state.p + 1) & 0xFFFF;
            instruction.cycles += 2;
            break;

        case Instruction.AddressingMode.absoluteY:
            value = memory.readWord(state.p);
            instruction.operand = (value + state.y) & 0xFFFF;
            instruction.cycles += ((instruction.slowIndexedAccess || (instruction.operand & 0xFF00) !== (value & 0xFF00)) ? 3 : 2);
            state.p = (state.p + 2) & 0xFFFF;
            break;

        case Instruction.AddressingMode.indexedIndirectX:
            value = (memory.read(state.p) + state.x) & 0xFF;

            if (value === 0xFF) 
                instruction.operand = memory.read(0xFF) + (memory.read(0x00) << 8);
            else instruction.operand = memory.readWord(value);

            instruction.cycles += 4;
            state.p = (state.p + 1) & 0xFFFF;
            break;

        case Instruction.AddressingMode.indirectIndexedY:
            value = memory.read(state.p);

            if (value === 0xFF)
                value = memory.read(0xFF) + (memory.read(0x00) << 8);
            else value = memory.readWord(value);

            instruction.operand = (value + state.y) & 0xFFFF;

            instruction.cycles += ((instruction.slowIndexedAccess || (value & 0xFF00) !== (instruction.operand & 0xFF00)) ? 4 : 3);
            state.p = (state.p + 1) & 0xFFFF;
            break;
    }

    if (dereference) {
        instruction.operand = memory.read(instruction.operand);
        instruction.cycles++;
    }
}

function compileInstruction(opcode: number): CompiledInstruction {
    var instruction = Instruction.opcodes[opcode],
        compiled = new CompiledInstruction(instruction);

    switch (instruction.operation) {
        case Instruction.Operation.adc:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                compiled.cycles = 0;
                decodeOperand(instruction, memory, state);
            };
            compiled.callback = opAdc;
            compiled.dereference = true;

            break;

        case Instruction.Operation.and:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }
            compiled.callback = opAnd;
            compiled.dereference = true;

            break;

        case Instruction.Operation.asl:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (instruction.instruction.addressingMode === Instruction.AddressingMode.implied) {
                    instruction.cycles = 1;
                    instruction.callback = opAslAcc;
                } else {
                    instruction.cycles = 3;
                    instruction.callback = opAslMem;
                }
                decodeOperand(instruction, memory, state);
            }

            compiled.slowIndexedAccess = true;

            break;

        case Instruction.Operation.bcc:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (state.flags & Cpu.Flags.c) {
                    instruction.callback = opNop;
                    state.p = (state.p + 1) & 0xFFFF;
                    instruction.cycles = 1;
                } else {
                    instruction.callback = opJmp;
                    instruction.cycles = 0;
                    decodeOperand(instruction, memory, state);
                }
            }

            break;

        case Instruction.Operation.bcs:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (state.flags & Cpu.Flags.c) {
                    instruction.callback = opJmp;
                    instruction.cycles = 0;
                    decodeOperand(instruction, memory, state);
                } else {
                    instruction.callback = opNop;
                    state.p = (state.p + 1) & 0xFFFF;
                    instruction.cycles = 1;
                }
            }

            break;

        case Instruction.Operation.beq:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (state.flags & Cpu.Flags.z) {
                    instruction.callback = opJmp;
                    instruction.cycles = 0;
                    decodeOperand(instruction, memory, state);
                } else {
                    instruction.callback = opNop;
                    state.p = (state.p + 1) & 0xFFFF;
                    instruction.cycles = 1;
                }
            }

            break;

        case Instruction.Operation.bit:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opBit;
            compiled.dereference = true;

            break;

        case Instruction.Operation.bmi:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (state.flags & Cpu.Flags.n) {
                    instruction.callback = opJmp;
                    instruction.cycles = 0;
                    decodeOperand(instruction, memory, state);
                } else {
                    instruction.callback = opNop;
                    state.p = (state.p + 1) & 0xFFFF;
                    instruction.cycles = 1;
                }
            }

            break;

        case Instruction.Operation.bne:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (state.flags & Cpu.Flags.z) {
                    instruction.callback = opNop;
                    state.p = (state.p + 1) & 0xFFFF;
                    instruction.cycles = 1;
                } else {
                    instruction.callback = opJmp;
                    instruction.cycles = 0;
                    decodeOperand(instruction, memory, state);
                }
            }

            break;

        case Instruction.Operation.bpl:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (state.flags & Cpu.Flags.n) {
                    instruction.callback = opNop;
                    state.p = (state.p + 1) & 0xFFFF;
                    instruction.cycles = 1;
                } else {
                    instruction.callback = opJmp;
                    instruction.cycles = 0;
                    decodeOperand(instruction, memory, state);
                }
            }

            break;

        case Instruction.Operation.bvc:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (state.flags & Cpu.Flags.v) {
                    instruction.callback = opNop;
                    state.p = (state.p + 1) & 0xFFFF;
                    instruction.cycles = 1;
                } else {
                    instruction.callback = opJmp;
                    instruction.cycles = 0;
                    decodeOperand(instruction, memory, state);
                }
            }

            break;

        case Instruction.Operation.bvs:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (state.flags & Cpu.Flags.v) {
                    instruction.callback = opJmp;
                    instruction.cycles = 0;
                    decodeOperand(instruction, memory, state);
                } else {
                    instruction.callback = opNop;
                    state.p = (state.p + 1) & 0xFFFF;
                    instruction.cycles = 1;
                }
            }

            break;

        case Instruction.Operation.clc:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opClc;

            break;

        case Instruction.Operation.cld:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opCld;

            break;

        case Instruction.Operation.cli:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opCli;

            break;

        case Instruction.Operation.clv:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opClv;

            break;

        case Instruction.Operation.cmp:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opCmp;
            compiled.dereference = true;

            break;

        case Instruction.Operation.cpx:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }


            compiled.callback = opCpx;
            compiled.dereference = true;

            break;

        case Instruction.Operation.cpy:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opCpy;
            compiled.dereference = true;

            break;

        case Instruction.Operation.dec:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 3;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opDec;
            compiled.slowIndexedAccess = true;

            break;

        case Instruction.Operation.dex:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opDex;

            break;

        case Instruction.Operation.dey:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opDey;

            break;

        case Instruction.Operation.eor:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opEor;
            compiled.dereference = true;

            break;

        case Instruction.Operation.inc:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 3;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opInc;
            compiled.slowIndexedAccess = true;

            break;

        case Instruction.Operation.inx:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opInx;

            break;

        case Instruction.Operation.iny:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opIny;

            break;

        case Instruction.Operation.jmp:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opJmp;

            break;

        case Instruction.Operation.jsr:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 3;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opJsr;

            break;

        case Instruction.Operation.lda:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opLda;
            compiled.dereference = true;

            break;

        case Instruction.Operation.ldx:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opLdx;
            compiled.dereference = true;

            break;

        case Instruction.Operation.ldy:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opLdy;
            compiled.dereference = true;

            break;

        case Instruction.Operation.lsr:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (instruction.addressingMode === Instruction.AddressingMode.implied) {
                    instruction.cycles = 1;
                    instruction.callback = opLsrAcc;
                } else {
                    instruction.cycles = 3;
                    instruction.callback = opLsrMem;
                }
                decodeOperand(instruction, memory, state);
            }

            compiled.slowIndexedAccess = true;

            break;

        case Instruction.Operation.nop:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opNop;

            break;

        case Instruction.Operation.ora:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opOra;
            compiled.dereference = true;

            break;

        case Instruction.Operation.php:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}
    
            compiled.cycles = 2;
            compiled.callback = opPhp;

            break;

        case Instruction.Operation.pha:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 2;
            compiled.callback = opPha;

            break;

        case Instruction.Operation.pla:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 3;
            compiled.callback = opPla;

            break;

        case Instruction.Operation.plp:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 3;
            compiled.callback = opPlp;

            break;

        case Instruction.Operation.rol:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (instruction.addressingMode === Instruction.AddressingMode.implied) {
                    instruction.cycles = 1;
                    instruction.callback = opRolAcc;
                } else {
                    instruction.cycles = 3;
                    instruction.callback = opRolMem;
                }
                decodeOperand(instruction, memory, state);
            }

            compiled.slowIndexedAccess = true;

            break;

        case Instruction.Operation.ror:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                if (instruction.addressingMode === Instruction.AddressingMode.implied) {
                    instruction.cycles = 1;
                    instruction.callback = opRorAcc;
                } else {
                    instruction.cycles = 3;
                    instruction.callback = opRorMem;
                }

                decodeOperand(instruction, memory, state);
            }

            compiled.slowIndexedAccess = true;

            break;

        case Instruction.Operation.rts:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 5;
            compiled.callback = opRts;

            break;

        case Instruction.Operation.sbc:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 0;
                decodeOperand(instruction, memory, state);
            }

            compiled.dereference = true;
            compiled.callback = opSbc;

            break;

        case Instruction.Operation.sec:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opSec;

            break;

        case Instruction.Operation.sed:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opSed;

            break;

        case Instruction.Operation.sei:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opSei;

            break;

        case Instruction.Operation.sta:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 1;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opSta;
            compiled.slowIndexedAccess = true;

            break;

        case Instruction.Operation.stx:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 1;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opStx;
            compiled.slowIndexedAccess = true;

            break;

        case Instruction.Operation.sty:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {
                instruction.cycles = 1;
                decodeOperand(instruction, memory, state);
            }

            compiled.callback = opSty;
            compiled.slowIndexedAccess = true;

            break;

        case Instruction.Operation.tax:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opTax;

            break;

        case Instruction.Operation.tay:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opTay;

            break;

        case Instruction.Operation.tsx:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opTsx;

            break;

        case Instruction.Operation.txa:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opTxa;

            break;

        case Instruction.Operation.txs:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opTxs;

            break;

        case Instruction.Operation.tya:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opTya;

            break;

        default:
            compiled.decode =
                (instruction: CompiledInstruction, memory: MemoryInterface, state: Cpu.State): void =>
            {}

            compiled.cycles = 1;
            compiled.callback = opNop;
            compiled.valid = false;
    }

    return compiled;
}

var compiledInstructions = new Array<CompiledInstruction>(0xFF);

(function() {
    for (var i = 0; i < 0x100; i++) compiledInstructions[i] = compileInstruction(i);
})();
