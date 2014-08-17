/// <reference path="./MemoryInterface.d.ts"/>

'use strict'

import Instruction = require('./Instruction');

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
        var instruction = Instruction.opcodes[this._memory.read(this.state.p)],
            addressingMode = instruction.addressingMode,
            dereference = false,
            slowIndexedAccess = false;

        this._lastInstructionPointer = this.state.p;

        switch (instruction.operation) {
            case Instruction.Operation.adc:
                this._opCycles = 0;
                this._instructionCallback = opAdc;
                dereference = true;
                break;

            case Instruction.Operation.and:
                this._opCycles = 0;
                this._instructionCallback = opAnd;
                dereference = true;
                break;

            case Instruction.Operation.asl:
                if (addressingMode === Instruction.AddressingMode.implied) {
                    this._opCycles = 1;
                    this._instructionCallback = opAslAcc;
                } else {
                    this._opCycles = 3;
                    this._instructionCallback = opAslMem;
                    slowIndexedAccess = true;
                }
                break;

            case Instruction.Operation.bcc:
                if (this.state.flags & Cpu.Flags.c) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) & 0xFFFF;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                }
                break;

            case Instruction.Operation.bcs:
                if (this.state.flags & Cpu.Flags.c) {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) & 0xFFFF;
                    this._opCycles = 1;
                }
                break;

            case Instruction.Operation.beq:
                if (this.state.flags & Cpu.Flags.z) {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) & 0xFFFF;
                    this._opCycles = 1;
                }
                break;

            case Instruction.Operation.bit:
                this._opCycles = 0;
                this._instructionCallback = opBit;
                dereference = true;
                break;

            case Instruction.Operation.bmi:
                if (this.state.flags & Cpu.Flags.n) {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) & 0xFFFF;
                    this._opCycles = 1;
                }
                break;

            case Instruction.Operation.bne:
                if (this.state.flags & Cpu.Flags.z) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) & 0xFFFF;
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
                    this.state.p = (this.state.p + 1) & 0xFFFF;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                }
                break;

            case Instruction.Operation.bvc:
                if (this.state.flags & Cpu.Flags.v) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) & 0xFFFF;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                }
                break;

            case Instruction.Operation.bvs:
                if (this.state.flags & Cpu.Flags.v) {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) & 0xFFFF;
                    this._opCycles = 1;
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

            case Instruction.Operation.cli:
                this._opCycles = 1;
                this._instructionCallback = opCli;
                break;

            case Instruction.Operation.clv:
                this._opCycles = 1;
                this._instructionCallback = opClv;
                break;

            case Instruction.Operation.cmp:
                this._opCycles = 0;
                this._instructionCallback = opCmp;
                dereference = true;
                break;

            case Instruction.Operation.cpx:
                this._opCycles = 0;
                this._instructionCallback = opCpx;
                dereference = true;
                break;

            case Instruction.Operation.cpy:
                this._opCycles = 0;
                this._instructionCallback = opCpy;
                dereference = true;
                break;

            case Instruction.Operation.dec:
                this._opCycles = 3;
                this._instructionCallback = opDec;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.dex:
                this._opCycles = 1;
                this._instructionCallback = opDex;
                break;

            case Instruction.Operation.dey:
                this._opCycles = 1;
                this._instructionCallback = opDey;
                break;

            case Instruction.Operation.eor:
                this._opCycles = 0;
                this._instructionCallback = opEor;
                dereference = true;
                break;

            case Instruction.Operation.inc:
                this._opCycles = 3;
                this._instructionCallback = opInc;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.inx:
                this._opCycles = 1;
                this._instructionCallback = opInx;
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

            case Instruction.Operation.lsr:
                if (addressingMode === Instruction.AddressingMode.implied) {
                    this._opCycles = 1;
                    this._instructionCallback = opLsrAcc;
                } else {
                    this._opCycles = 3;
                    this._instructionCallback = opLsrMem;
                    slowIndexedAccess = true;
                }
                break;

            case Instruction.Operation.nop:
                this._opCycles = 1;
                this._instructionCallback = opNop;
                break;

            case Instruction.Operation.ora:
                this._opCycles = 0;
                this._instructionCallback = opOra;
                dereference = true;
                break;

            case Instruction.Operation.php:
                this._opCycles = 2;
                this._instructionCallback = opPhp;
                break;

            case Instruction.Operation.pha:
                this._opCycles = 2;
                this._instructionCallback = opPha;
                break;

            case Instruction.Operation.pla:
                this._opCycles = 3;
                this._instructionCallback = opPla;
                break;

            case Instruction.Operation.plp:
                this._opCycles = 3;
                this._instructionCallback = opPlp;
                break;

            case Instruction.Operation.rol:
                if (addressingMode === Instruction.AddressingMode.implied) {
                    this._opCycles = 1;
                    this._instructionCallback = opRolAcc;
                } else {
                    this._opCycles = 3;
                    this._instructionCallback = opRolMem;
                    slowIndexedAccess = true;
                }
                break;

            case Instruction.Operation.ror:
                if (addressingMode === Instruction.AddressingMode.implied) {
                    this._opCycles = 1;
                    this._instructionCallback = opRorAcc;
                } else {
                    this._opCycles = 3;
                    this._instructionCallback = opRorMem;
                    slowIndexedAccess = true;
                }
                break;

            case Instruction.Operation.rts:
                this._opCycles = 5;
                this._instructionCallback = opRts;
                break;

            case Instruction.Operation.sbc:
                this._opCycles = 0;
                this._instructionCallback = opSbc;
                dereference = true;
                break;

            case Instruction.Operation.sec:
                this._opCycles = 1;
                this._instructionCallback = opSec;
                break;

            case Instruction.Operation.sed:
                this._opCycles = 1;
                this._instructionCallback = opSed;
                break;

            case Instruction.Operation.sei:
                this._opCycles = 1;
                this._instructionCallback = opSei;
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

            case Instruction.Operation.tax:
                this._opCycles = 1;
                this._instructionCallback = opTax;
                break;

            case Instruction.Operation.tay:
                this._opCycles = 1;
                this._instructionCallback = opTay;
                break;

            case Instruction.Operation.tsx:
                this._opCycles = 1;
                this._instructionCallback = opTsx;
                break;

            case Instruction.Operation.txa:
                this._opCycles = 1;
                this._instructionCallback = opTxa;
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
                if (this._invalidInstructionCallback) this._invalidInstructionCallback(this);
                addressingMode = Instruction.AddressingMode.invalid;
                this._opCycles = 1;
                this._instructionCallback = opNop;
        }

        this.state.p = (this.state.p + 1) & 0xFFFF;

        var value: number;

        switch (addressingMode) {
            case Instruction.AddressingMode.immediate:
                this._operand = this._memory.read(this.state.p);
                dereference = false;
                this.state.p = (this.state.p + 1) & 0xFFFF;
                this._opCycles++;
                break;

            case Instruction.AddressingMode.zeroPage:
                this._operand = this._memory.read(this.state.p);
                this.state.p = (this.state.p + 1) & 0xFFFF;
                this._opCycles++;
                break;

            case Instruction.AddressingMode.absolute:
                this._operand = this._memory.readWord(this.state.p);
                this.state.p = (this.state.p + 2) & 0xFFFF;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.indirect:
                value = this._memory.readWord(this.state.p);
                if ((value & 0xFF) === 0xFF)
                    this._operand = this._memory.read(value) + (this._memory.read(value & 0xFF00) << 8);
                else this._operand = this._memory.readWord(value);
                this.state.p = (this.state.p + 2) & 0xFFFF;
                this._opCycles += 4;
                break;

            case Instruction.AddressingMode.relative:
                value = this._memory.read(this.state.p);
                value = (value & 0x80) ? -(~(value - 1) & 0xFF) : value;
                this._operand = (this.state.p + value + 0x10001) & 0xFFFF;
                this._opCycles += (((this._operand & 0xFF00) !== (this.state.p & 0xFF00)) ? 3 : 2);
                this.state.p = (this.state.p + 1) & 0xFFFF;
                break;

            case Instruction.AddressingMode.zeroPageX:
                this._operand = (this._memory.read(this.state.p) + this.state.x) & 0xFF;
                this.state.p = (this.state.p + 1) & 0xFFFF;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.absoluteX:
                value = this._memory.readWord(this.state.p);
                this._operand = (value + this.state.x) & 0xFFFF;
                this._opCycles += ((slowIndexedAccess || (this._operand & 0xFF00) !== (value & 0xFF00)) ? 3 : 2)
                this.state.p = (this.state.p + 2) & 0xFFFF;
                break;

            case Instruction.AddressingMode.zeroPageY:
                this._operand = (this._memory.read(this.state.p) + this.state.y) & 0xFF;
                this.state.p = (this.state.p + 1) & 0xFFFF;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.absoluteY:
                value = this._memory.readWord(this.state.p);
                this._operand = (value + this.state.y) & 0xFFFF;
                this._opCycles += ((slowIndexedAccess || (this._operand & 0xFF00) !== (value & 0xFF00)) ? 3 : 2);
                this.state.p = (this.state.p + 2) & 0xFFFF;
                break;

            case Instruction.AddressingMode.indexedIndirectX:
                value = (this._memory.read(this.state.p) + this.state.x) & 0xFF;

                if (value === 0xFF) 
                    this._operand = this._memory.read(0xFF) + (this._memory.read(0x00) << 8);
                else this._operand = this._memory.readWord(value);

                this._opCycles += 4;
                this.state.p = (this.state.p + 1) & 0xFFFF;
                break;

            case Instruction.AddressingMode.indirectIndexedY:
                value = this._memory.read(this.state.p);

                if (value === 0xFF)
                    value = this._memory.read(0xFF) + (this._memory.read(0x00) << 8);
                else value = this._memory.readWord(value);

                this._operand = (value + this.state.y) & 0xFFFF;

                this._opCycles += ((slowIndexedAccess || (value & 0xFF00) !== (this._operand & 0xFF00)) ? 4 : 3);
                this.state.p = (this.state.p + 1) & 0xFFFF;
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
