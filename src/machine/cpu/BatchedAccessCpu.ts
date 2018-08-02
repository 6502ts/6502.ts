/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import Instruction from './Instruction';
import BusInterface from '../bus/BusInterface';
import CpuInterface from './CpuInterface';
import * as ops from './ops';

import RngInterface from '../../tools/rng/GeneratorInterface';

const enum InterruptCheck {
    endOfInstruction,
    beforeOp
}
export function opBoot(state: CpuInterface.State, bus: BusInterface): void {
    state.p = bus.readWord(0xfffc);
}

function dispatchInterrupt(state: CpuInterface.State, bus: BusInterface, vector: number): void {
    const nextOpAddr = state.p;

    if (state.nmi) {
        vector = 0xfffa;
    }

    state.nmi = state.irq = false;

    bus.write(state.s + 0x0100, (nextOpAddr >>> 8) & 0xff);
    state.s = (state.s + 0xff) & 0xff;
    bus.write(state.s + 0x0100, nextOpAddr & 0xff);
    state.s = (state.s + 0xff) & 0xff;

    bus.write(state.s + 0x0100, state.flags & ~CpuInterface.Flags.b);
    state.s = (state.s + 0xff) & 0xff;

    state.flags |= CpuInterface.Flags.i;

    state.p = bus.readWord(vector);
}

export function opIrq(state: CpuInterface.State, bus: BusInterface) {
    dispatchInterrupt(state, bus, 0xfffe);
}

export function opNmi(state: CpuInterface.State, bus: BusInterface) {
    dispatchInterrupt(state, bus, 0xfffa);
}

class BatchedAccessCpu {
    constructor(private _bus: BusInterface, private _rng?: RngInterface) {
        this.reset();
    }

    setInterrupt(irq: boolean): BatchedAccessCpu {
        this._interruptPending = irq;
        return this;
    }

    isInterrupt(): boolean {
        return this._interruptPending;
    }

    nmi(): BatchedAccessCpu {
        this._nmiPending = true;
        return this;
    }

    halt(): BatchedAccessCpu {
        this._halted = true;
        return this;
    }

    resume(): BatchedAccessCpu {
        this._halted = false;
        return this;
    }

    isHalt(): boolean {
        return this._halted;
    }

    setInvalidInstructionCallback(callback: CpuInterface.InvalidInstructionCallbackInterface): BatchedAccessCpu {
        this._invalidInstructionCallback = callback;
        return this;
    }

    getInvalidInstructionCallback(): CpuInterface.InvalidInstructionCallbackInterface {
        return this._invalidInstructionCallback;
    }

    getLastInstructionPointer(): number {
        return this._lastInstructionPointer;
    }

    reset(): BatchedAccessCpu {
        this.state.a = this._rng ? this._rng.int(0xff) : 0;
        this.state.x = this._rng ? this._rng.int(0xff) : 0;
        this.state.y = this._rng ? this._rng.int(0xff) : 0;
        this.state.s = 0xfd;
        this.state.p = this._rng ? this._rng.int(0xffff) : 0;
        this.state.flags =
            (this._rng ? this._rng.int(0xff) : 0) | CpuInterface.Flags.i | CpuInterface.Flags.e | CpuInterface.Flags.b;
        this.state.irq = false;
        this.state.nmi = false;

        this.executionState = CpuInterface.ExecutionState.boot;
        this._opCycles = 7;
        this._interruptPending = false;
        this._nmiPending = false;

        this._instructionCallback = opBoot;

        return this;
    }

    cycle(): BatchedAccessCpu {
        if (this._halted) {
            return this;
        }

        switch (this.executionState) {
            case CpuInterface.ExecutionState.boot:
            case CpuInterface.ExecutionState.execute:
                if (--this._opCycles === 0) {
                    if (this._dereference) {
                        this._operand = this._bus.read(this._operand);
                    }

                    if (this._interuptCheck === InterruptCheck.beforeOp) {
                        this._checkForInterrupts();
                    }

                    this._instructionCallback(this.state, this._bus, this._operand, this._currentAddressingMode);
                    this.executionState = CpuInterface.ExecutionState.fetch;

                    if (this._interuptCheck === InterruptCheck.endOfInstruction) {
                        this._checkForInterrupts();
                    }
                }

                break;

            case CpuInterface.ExecutionState.fetch:
                if (this.state.nmi) {
                    this._instructionCallback = opNmi;
                    this._opCycles = 6;
                    this.state.nmi = this.state.irq = false;
                    this._interuptCheck = InterruptCheck.beforeOp;
                    this.executionState = CpuInterface.ExecutionState.execute;

                    return this;
                }

                if (this.state.irq) {
                    this._instructionCallback = opIrq;
                    this._opCycles = 6;
                    this.state.nmi = this.state.irq = false;
                    this._interuptCheck = InterruptCheck.beforeOp;
                    this.executionState = CpuInterface.ExecutionState.execute;

                    return this;
                }

                this._fetch();
                break;
        }

        return this;
    }

    private _fetch() {
        const instruction = Instruction.opcodes[this._bus.read(this.state.p)];

        let addressingMode = instruction.addressingMode,
            dereference = false,
            slowIndexedAccess = false;

        this._lastInstructionPointer = this.state.p;
        this._currentAddressingMode = addressingMode;
        this._interuptCheck = InterruptCheck.endOfInstruction;

        switch (instruction.operation) {
            case Instruction.Operation.adc:
                this._opCycles = 0;
                this._instructionCallback = ops.opAdc;
                dereference = true;
                break;

            case Instruction.Operation.and:
                this._opCycles = 0;
                this._instructionCallback = ops.opAnd;
                dereference = true;
                break;

            case Instruction.Operation.asl:
                if (addressingMode === Instruction.AddressingMode.implied) {
                    this._opCycles = 1;
                    this._instructionCallback = ops.opAslAcc;
                } else {
                    this._opCycles = 3;
                    this._instructionCallback = ops.opAslMem;
                    slowIndexedAccess = true;
                }
                break;

            case Instruction.Operation.bcc:
                if (this.state.flags & CpuInterface.Flags.c) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = ops.opNop;
                    this.state.p = (this.state.p + 1) & 0xffff;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = ops.opJmp;
                    this._opCycles = 0;
                }
                break;

            case Instruction.Operation.bcs:
                if (this.state.flags & CpuInterface.Flags.c) {
                    this._instructionCallback = ops.opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = ops.opNop;
                    this.state.p = (this.state.p + 1) & 0xffff;
                    this._opCycles = 1;
                }
                break;

            case Instruction.Operation.beq:
                if (this.state.flags & CpuInterface.Flags.z) {
                    this._instructionCallback = ops.opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = ops.opNop;
                    this.state.p = (this.state.p + 1) & 0xffff;
                    this._opCycles = 1;
                }
                break;

            case Instruction.Operation.bit:
                this._opCycles = 0;
                this._instructionCallback = ops.opBit;
                dereference = true;
                break;

            case Instruction.Operation.bmi:
                if (this.state.flags & CpuInterface.Flags.n) {
                    this._instructionCallback = ops.opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = ops.opNop;
                    this.state.p = (this.state.p + 1) & 0xffff;
                    this._opCycles = 1;
                }
                break;

            case Instruction.Operation.bne:
                if (this.state.flags & CpuInterface.Flags.z) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = ops.opNop;
                    this.state.p = (this.state.p + 1) & 0xffff;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = ops.opJmp;
                    this._opCycles = 0;
                }
                break;

            case Instruction.Operation.bpl:
                if (this.state.flags & CpuInterface.Flags.n) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = ops.opNop;
                    this.state.p = (this.state.p + 1) & 0xffff;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = ops.opJmp;
                    this._opCycles = 0;
                }
                break;

            case Instruction.Operation.bvc:
                if (this.state.flags & CpuInterface.Flags.v) {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = ops.opNop;
                    this.state.p = (this.state.p + 1) & 0xffff;
                    this._opCycles = 1;
                } else {
                    this._instructionCallback = ops.opJmp;
                    this._opCycles = 0;
                }
                break;

            case Instruction.Operation.bvs:
                if (this.state.flags & CpuInterface.Flags.v) {
                    this._instructionCallback = ops.opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = ops.opNop;
                    this.state.p = (this.state.p + 1) & 0xffff;
                    this._opCycles = 1;
                }
                break;

            case Instruction.Operation.brk:
                this._opCycles = 6;
                this._instructionCallback = ops.opBrk;
                this._interuptCheck = InterruptCheck.beforeOp;
                break;

            case Instruction.Operation.clc:
                this._opCycles = 1;
                this._instructionCallback = ops.opClc;
                break;

            case Instruction.Operation.cld:
                this._opCycles = 1;
                this._instructionCallback = ops.opCld;
                break;

            case Instruction.Operation.cli:
                this._opCycles = 1;
                this._instructionCallback = ops.opCli;
                this._interuptCheck = InterruptCheck.beforeOp;
                break;

            case Instruction.Operation.clv:
                this._opCycles = 1;
                this._instructionCallback = ops.opClv;
                break;

            case Instruction.Operation.cmp:
                this._opCycles = 0;
                this._instructionCallback = ops.opCmp;
                dereference = true;
                break;

            case Instruction.Operation.cpx:
                this._opCycles = 0;
                this._instructionCallback = ops.opCpx;
                dereference = true;
                break;

            case Instruction.Operation.cpy:
                this._opCycles = 0;
                this._instructionCallback = ops.opCpy;
                dereference = true;
                break;

            case Instruction.Operation.dec:
                this._opCycles = 3;
                this._instructionCallback = ops.opDec;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.dex:
                this._opCycles = 1;
                this._instructionCallback = ops.opDex;
                break;

            case Instruction.Operation.dey:
                this._opCycles = 1;
                this._instructionCallback = ops.opDey;
                break;

            case Instruction.Operation.eor:
                this._opCycles = 0;
                this._instructionCallback = ops.opEor;
                dereference = true;
                break;

            case Instruction.Operation.inc:
                this._opCycles = 3;
                this._instructionCallback = ops.opInc;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.inx:
                this._opCycles = 1;
                this._instructionCallback = ops.opInx;
                break;

            case Instruction.Operation.iny:
                this._opCycles = 1;
                this._instructionCallback = ops.opIny;
                break;

            case Instruction.Operation.jmp:
                this._opCycles = 0;
                this._instructionCallback = ops.opJmp;
                break;

            case Instruction.Operation.jsr:
                this._opCycles = 5;
                this._instructionCallback = ops.opJsr;
                break;

            case Instruction.Operation.lda:
                this._opCycles = addressingMode === Instruction.AddressingMode.immediate ? 0 : 1;
                this._instructionCallback = ops.opLda;
                break;

            case Instruction.Operation.ldx:
                this._opCycles = addressingMode === Instruction.AddressingMode.immediate ? 0 : 1;
                this._instructionCallback = ops.opLdx;
                break;

            case Instruction.Operation.ldy:
                this._opCycles = addressingMode === Instruction.AddressingMode.immediate ? 0 : 1;
                this._instructionCallback = ops.opLdy;
                break;

            case Instruction.Operation.lsr:
                if (addressingMode === Instruction.AddressingMode.implied) {
                    this._opCycles = 1;
                    this._instructionCallback = ops.opLsrAcc;
                } else {
                    this._opCycles = 3;
                    this._instructionCallback = ops.opLsrMem;
                    slowIndexedAccess = true;
                }
                break;

            case Instruction.Operation.nop:
                this._opCycles = 1;

                this._instructionCallback = ops.opNop;
                break;

            case Instruction.Operation.dop:
            case Instruction.Operation.top:
                this._opCycles = 0;
                dereference = true;

                this._instructionCallback = ops.opNop;
                break;

            case Instruction.Operation.ora:
                this._opCycles = 0;
                this._instructionCallback = ops.opOra;
                dereference = true;
                break;

            case Instruction.Operation.php:
                this._opCycles = 2;
                this._instructionCallback = ops.opPhp;
                break;

            case Instruction.Operation.pha:
                this._opCycles = 2;
                this._instructionCallback = ops.opPha;
                break;

            case Instruction.Operation.pla:
                this._opCycles = 3;
                this._instructionCallback = ops.opPla;
                break;

            case Instruction.Operation.plp:
                this._opCycles = 3;
                this._instructionCallback = ops.opPlp;
                this._interuptCheck = InterruptCheck.beforeOp;
                break;

            case Instruction.Operation.rol:
                if (addressingMode === Instruction.AddressingMode.implied) {
                    this._opCycles = 1;
                    this._instructionCallback = ops.opRolAcc;
                } else {
                    this._opCycles = 3;
                    this._instructionCallback = ops.opRolMem;
                    slowIndexedAccess = true;
                }
                break;

            case Instruction.Operation.ror:
                if (addressingMode === Instruction.AddressingMode.implied) {
                    this._opCycles = 1;
                    this._instructionCallback = ops.opRorAcc;
                } else {
                    this._opCycles = 3;
                    this._instructionCallback = ops.opRorMem;
                    slowIndexedAccess = true;
                }
                break;

            case Instruction.Operation.rti:
                this._opCycles = 5;
                this._instructionCallback = ops.opRti;
                break;

            case Instruction.Operation.rts:
                this._opCycles = 5;
                this._instructionCallback = ops.opRts;
                break;

            case Instruction.Operation.sbc:
                this._opCycles = 0;
                this._instructionCallback = ops.opSbc;
                dereference = true;
                break;

            case Instruction.Operation.sec:
                this._opCycles = 1;
                this._instructionCallback = ops.opSec;
                break;

            case Instruction.Operation.sed:
                this._opCycles = 1;
                this._instructionCallback = ops.opSed;
                break;

            case Instruction.Operation.sei:
                this._opCycles = 1;
                this._instructionCallback = ops.opSei;
                this._interuptCheck = InterruptCheck.beforeOp;
                break;

            case Instruction.Operation.sta:
                this._opCycles = 1;
                this._instructionCallback = ops.opSta;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.stx:
                this._opCycles = 1;
                this._instructionCallback = ops.opStx;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.sty:
                this._opCycles = 1;
                this._instructionCallback = ops.opSty;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.tax:
                this._opCycles = 1;
                this._instructionCallback = ops.opTax;
                break;

            case Instruction.Operation.tay:
                this._opCycles = 1;
                this._instructionCallback = ops.opTay;
                break;

            case Instruction.Operation.tsx:
                this._opCycles = 1;
                this._instructionCallback = ops.opTsx;
                break;

            case Instruction.Operation.txa:
                this._opCycles = 1;
                this._instructionCallback = ops.opTxa;
                break;

            case Instruction.Operation.txs:
                this._opCycles = 1;
                this._instructionCallback = ops.opTxs;
                break;

            case Instruction.Operation.tya:
                this._opCycles = 1;
                this._instructionCallback = ops.opTya;
                break;

            case Instruction.Operation.arr:
                this._opCycles = 0;
                this._instructionCallback = ops.opArr;
                break;

            case Instruction.Operation.alr:
                this._opCycles = 0;
                this._instructionCallback = ops.opAlr;
                break;

            case Instruction.Operation.axs:
                this._opCycles = 0;
                this._instructionCallback = ops.opAxs;
                break;

            case Instruction.Operation.dcp:
                this._opCycles = 3;
                this._instructionCallback = ops.opDcp;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.lax:
                this._opCycles = 0;
                this._instructionCallback = ops.opLax;
                dereference = true;
                break;

            case Instruction.Operation.slo:
                this._opCycles = 2;
                this._instructionCallback = ops.opSlo;
                slowIndexedAccess = true;
                break;

            case Instruction.Operation.aax:
                this._opCycles = 1;
                this._instructionCallback = ops.opAax;
                break;

            case Instruction.Operation.lar:
                this._opCycles = 0;
                this._instructionCallback = ops.opLar;
                dereference = true;
                break;

            case Instruction.Operation.isc:
                this._opCycles = 3;
                this._instructionCallback = ops.opIsc;
                break;

            case Instruction.Operation.aac:
                this._opCycles = 0;
                this._instructionCallback = ops.opAac;
                break;

            case Instruction.Operation.atx:
                this._opCycles = 0;
                this._instructionCallback = ops.opAtx;
                break;

            case Instruction.Operation.rra:
                this._opCycles = 3;
                dereference = false;
                slowIndexedAccess = true;
                this._instructionCallback = ops.opRra;
                break;

            case Instruction.Operation.rla:
                this._opCycles = 3;
                dereference = false;
                slowIndexedAccess = true;
                this._instructionCallback = ops.opRla;
                break;

            default:
                if (this._invalidInstructionCallback) {
                    this._invalidInstructionCallback(this);
                }
                return;
        }

        this.state.p = (this.state.p + 1) & 0xffff;

        let value: number, base: number;

        switch (addressingMode) {
            case Instruction.AddressingMode.immediate:
                this._operand = this._bus.read(this.state.p);
                dereference = false;
                this.state.p = (this.state.p + 1) & 0xffff;
                this._opCycles++;
                break;

            case Instruction.AddressingMode.zeroPage:
                this._operand = this._bus.read(this.state.p);
                this.state.p = (this.state.p + 1) & 0xffff;
                this._opCycles++;
                break;

            case Instruction.AddressingMode.absolute:
                this._operand = this._bus.readWord(this.state.p);
                this.state.p = (this.state.p + 2) & 0xffff;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.indirect:
                value = this._bus.readWord(this.state.p);
                if ((value & 0xff) === 0xff) {
                    this._operand = this._bus.read(value) + (this._bus.read(value & 0xff00) << 8);
                } else {
                    this._operand = this._bus.readWord(value);
                }
                this.state.p = (this.state.p + 2) & 0xffff;
                this._opCycles += 4;
                break;

            case Instruction.AddressingMode.relative:
                value = this._bus.read(this.state.p);
                value = value & 0x80 ? -(~(value - 1) & 0xff) : value;
                this._operand = (this.state.p + value + 0x10001) & 0xffff;
                this.state.p = (this.state.p + 1) & 0xffff;
                this._opCycles += (this._operand & 0xff00) !== (this.state.p & 0xff00) ? 3 : 2;
                break;

            case Instruction.AddressingMode.zeroPageX:
                base = this._bus.read(this.state.p);
                this._bus.read(base);

                this._operand = (base + this.state.x) & 0xff;
                this.state.p = (this.state.p + 1) & 0xffff;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.absoluteX:
                value = this._bus.readWord(this.state.p);
                this._operand = (value + this.state.x) & 0xffff;

                if ((this._operand & 0xff00) !== (value & 0xff00)) {
                    this._bus.read((value & 0xff00) | (this._operand & 0xff));
                }

                this._opCycles += slowIndexedAccess || (this._operand & 0xff00) !== (value & 0xff00) ? 3 : 2;
                this.state.p = (this.state.p + 2) & 0xffff;
                break;

            case Instruction.AddressingMode.zeroPageY:
                base = this._bus.read(this.state.p);
                this._bus.read(base);

                this._operand = (base + this.state.y) & 0xff;
                this.state.p = (this.state.p + 1) & 0xffff;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.absoluteY:
                value = this._bus.readWord(this.state.p);
                this._operand = (value + this.state.y) & 0xffff;

                if ((this._operand & 0xff00) !== (value & 0xff00)) {
                    this._bus.read((value & 0xff00) | (this._operand & 0xff));
                }

                this._opCycles += slowIndexedAccess || (this._operand & 0xff00) !== (value & 0xff00) ? 3 : 2;
                this.state.p = (this.state.p + 2) & 0xffff;
                break;

            case Instruction.AddressingMode.indexedIndirectX:
                base = this._bus.read(this.state.p);
                this._bus.read(base);

                value = (base + this.state.x) & 0xff;

                if (value === 0xff) {
                    this._operand = this._bus.read(0xff) + (this._bus.read(0x00) << 8);
                } else {
                    this._operand = this._bus.readWord(value);
                }

                this._opCycles += 4;
                this.state.p = (this.state.p + 1) & 0xffff;
                break;

            case Instruction.AddressingMode.indirectIndexedY:
                value = this._bus.read(this.state.p);

                if (value === 0xff) {
                    value = this._bus.read(0xff) + (this._bus.read(0x00) << 8);
                } else {
                    value = this._bus.readWord(value);
                }

                this._operand = (value + this.state.y) & 0xffff;

                if ((this._operand & 0xff00) !== (value & 0xff00)) {
                    this._bus.read((value & 0xff00) | (this._operand & 0xff));
                }

                this._opCycles += slowIndexedAccess || (value & 0xff00) !== (this._operand & 0xff00) ? 4 : 3;
                this.state.p = (this.state.p + 1) & 0xffff;
                break;
        }

        this._dereference = dereference;
        if (dereference) {
            this._opCycles++;
        }

        this.executionState = CpuInterface.ExecutionState.execute;
    }

    private _checkForInterrupts(): void {
        if (this._nmiPending) {
            this.state.irq = false;
            this.state.nmi = true;
            this._nmiPending = false;
        }

        if (this._interruptPending && !this.state.nmi && !(this.state.flags & CpuInterface.Flags.i)) {
            this.state.irq = true;
        }
    }

    executionState: CpuInterface.ExecutionState = CpuInterface.ExecutionState.boot;
    state: CpuInterface.State = new CpuInterface.State();

    private _opCycles: number = 0;
    private _instructionCallback: InstructionCallbackInterface = null;
    private _invalidInstructionCallback: CpuInterface.InvalidInstructionCallbackInterface = null;

    private _interruptPending: boolean = false;
    private _nmiPending: boolean = false;
    private _interuptCheck = InterruptCheck.endOfInstruction;

    private _halted: boolean = false;

    private _operand: number = 0;
    private _lastInstructionPointer: number = 0;
    private _currentAddressingMode: Instruction.AddressingMode = Instruction.AddressingMode.invalid;

    private _dereference = false;
}

interface InstructionCallbackInterface {
    (
        state?: CpuInterface.State,
        bus?: BusInterface,
        operand?: number,
        addressingMode?: Instruction.AddressingMode
    ): void;
}

export { BatchedAccessCpu as default };
