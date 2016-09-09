import Instruction from './Instruction';
import BusInterface from '../bus/BusInterface';
import CpuInterface from './CpuInterface';

import RngInterface from '../../tools/rng/GeneratorInterface';

function setFlagsNZ(state: CpuInterface.State, operand: number): void {
    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z)) |
        (operand & 0x80) |
        (operand ? 0 : CpuInterface.Flags.z);
}

function opBoot(state: CpuInterface.State, bus: BusInterface): void {
    state.p = bus.readWord(0xFFFC);
}

function opAdc(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    if (state.flags & CpuInterface.Flags.d) {
        const d0 = (operand & 0x0F) + (state.a & 0x0F) + (state.flags & CpuInterface.Flags.c),
            d1 = (operand >>> 4) + (state.a >>> 4) + (d0 > 9 ? 1 : 0);

        state.a = (d0 % 10) | ((d1 % 10) << 4);

        state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
            (state.a & 0x80) |  // negative
            (state.a ? 0 : CpuInterface.Flags.z) |   // zero
            (d1 > 9 ? CpuInterface.Flags.c : 0);     // carry
    } else {
        const sum = state.a + operand + (state.flags & CpuInterface.Flags.c),
            result = sum & 0xFF;

        state.flags =
            (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c | CpuInterface.Flags.v)) |
            (result & 0x80) |  // negative
            (result ? 0 : CpuInterface.Flags.z) |   // zero
            (sum >>> 8) |         // carry
            (((~(operand ^ state.a) & (result ^ operand)) & 0x80) >>> 1); // overflow

        state.a = result;
    }
}

function opAnd(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a &= operand;
    setFlagsNZ(state, state.a);
}

function opAslAcc(state: CpuInterface.State): void {
    const old = state.a;
    state.a = (state.a << 1) & 0xFF;

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

function opAslMem(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = (old << 1) & 0xFF;
    bus.write(operand, value);

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

function opBit(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.v | CpuInterface.Flags.z)) |
        (operand & (CpuInterface.Flags.n | CpuInterface.Flags.v)) |
        ((operand & state.a) ? 0 : CpuInterface.Flags.z);
}

function opBrk(state: CpuInterface.State, bus: BusInterface): void {
    const nextOpAddr = (state.p + 1) & 0xFFFF;

    bus.write(state.s + 0x0100, (nextOpAddr >>> 8) & 0xFF);
    state.s = (state.s + 0xFF) & 0xFF;
    bus.write(state.s + 0x0100, nextOpAddr & 0xFF);
    state.s = (state.s + 0xFF) & 0xFF;

    bus.write(state.s + 0x0100, state.flags | CpuInterface.Flags.b);
    state.s = (state.s + 0xFF) & 0xFF;

    state.flags |= CpuInterface.Flags.i;

    state.p = (bus.readWord(0xFFFE));
}

function opClc(state: CpuInterface.State): void {
    state.flags &= ~CpuInterface.Flags.c;
}

function opCld(state: CpuInterface.State): void {
    state.flags &= ~CpuInterface.Flags.d;
}

function opCli(state: CpuInterface.State): void {
    state.flags &= ~CpuInterface.Flags.i;
}

function opClv(state: CpuInterface.State): void {
    state.flags &= ~CpuInterface.Flags.v;
}

function opCmp(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const diff = state.a + (~operand & 0xFF) + 1;

     state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        ((diff & 0xFF) ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

function opCpx(state: CpuInterface.State, bus: BusInterface, operand: number): void {
     const diff = state.x + (~operand & 0xFF) + 1;

     state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        ((diff & 0xFF) ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

function opCpy(state: CpuInterface.State, bus: BusInterface, operand: number): void {
     const diff = state.y + (~operand & 0xFF) + 1;

     state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        ((diff & 0xFF) ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

function opDec(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const value = (bus.read(operand) + 0xFF) & 0xFF;
    bus.write(operand, value);
    setFlagsNZ(state, value);
}

function opDex(state: CpuInterface.State): void {
    state.x = (state.x + 0xFF) & 0xFF;
    setFlagsNZ(state, state.x);
}

function opEor(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a = state.a ^ operand;
    setFlagsNZ(state, state.a);
}

function opDey(state: CpuInterface.State): void {
    state.y = (state.y + 0xFF) & 0xFF;
    setFlagsNZ(state, state.y);
}

function opInc(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const value = (bus.read(operand) + 1) & 0xFF;
    bus.write(operand, value);
    setFlagsNZ(state, value);
}

function opInx(state: CpuInterface.State): void {
    state.x = (state.x + 0x01) & 0xFF;
    setFlagsNZ(state, state.x);
}

function opIny(state: CpuInterface.State): void {
    state.y = (state.y + 0x01) & 0xFF;
    setFlagsNZ(state, state.y);
}

function opJmp(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.p = operand;
}

function opJsr(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const returnPtr = (state.p + 0xFFFF) & 0xFFFF;

    bus.write(0x0100 + state.s, returnPtr >>> 8);
    state.s = (state.s + 0xFF) & 0xFF;
    bus.write(0x0100 + state.s, returnPtr & 0xFF);
    state.s = (state.s + 0xFF) & 0xFF;

    state.p = operand;
}

function opLda(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a = operand;
    setFlagsNZ(state, operand);
}

function opLdx(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.x = operand;
    setFlagsNZ(state, operand);
}

function opLdy(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.y = operand;
    setFlagsNZ(state, operand);
}

function opLsrAcc(state: CpuInterface.State): void {
    const old = state.a;
    state.a = state.a >>> 1;

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

function opLsrMem(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = old >>> 1;
    bus.write(operand, value);

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

function opNop(): void {}

function opOra(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a |= operand;
    setFlagsNZ(state, state.a);
}

function opPhp(state: CpuInterface.State, bus: BusInterface): void {
    bus.write(0x0100 + state.s, state.flags);
    state.s = (state.s + 0xFF) & 0xFF;
}

function opPlp(state: CpuInterface.State, bus: BusInterface): void {
    const mask = CpuInterface.Flags.b | CpuInterface.Flags.e;

    state.s = (state.s + 0x01) & 0xFF;
    state.flags = (state.flags & mask) | (bus.read(0x0100 + state.s) & ~mask);
}

function opPha(state: CpuInterface.State, bus: BusInterface): void {
    bus.write(0x0100 + state.s, state.a);
    state.s = (state.s + 0xFF) & 0xFF;
}

function opPla(state: CpuInterface.State, bus: BusInterface): void {
    state.s = (state.s + 0x01) & 0xFF;
    state.a = bus.read(0x0100 + state.s);
    setFlagsNZ(state, state.a);
}

function opRolAcc(state: CpuInterface.State): void {
    const old = state.a;
    state.a = ((state.a << 1) & 0xFF) | (state.flags & CpuInterface.Flags.c);

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

function opRolMem(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = ((old << 1) & 0xFF) | (state.flags & CpuInterface.Flags.c);
    bus.write(operand, value);

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

function opRorAcc(state: CpuInterface.State): void {
    const old = state.a;
    state.a = (state.a >>> 1) | ((state.flags & CpuInterface.Flags.c) << 7);

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

function opRorMem(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = (old >>> 1) | ((state.flags & CpuInterface.Flags.c) << 7);
    bus.write(operand, value);

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

function opRti(state: CpuInterface.State, bus: BusInterface): void {
    let returnPtr: number;

    state.s = (state.s + 1) & 0xFF;
    state.flags = bus.read(0x0100 + state.s);

    state.s = (state.s + 1) & 0xFF;
    returnPtr = bus.read(0x0100 + state.s);
    state.s = (state.s + 1) & 0xFF;
    returnPtr |= (bus.read(0x0100 + state.s) << 8);

    state.p = returnPtr;
}

function opRts(state: CpuInterface.State, bus: BusInterface): void {
    let returnPtr: number;

    state.s = (state.s + 1) & 0xFF;
    returnPtr = bus.read(0x0100 + state.s);
    state.s = (state.s + 1) & 0xFF;
    returnPtr += (bus.read(0x0100 + state.s) << 8);

    state.p = (returnPtr + 1) & 0xFFFF;
}

function opSbc(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    if (state.flags & CpuInterface.Flags.d) {
        const d0 = ((state.a & 0x0F) - (operand & 0x0F) - (~state.flags & CpuInterface.Flags.c)),
            d1 = ((state.a >>> 4) - (operand >>> 4) - (d0 < 0 ? 1 : 0));

        state.a = (d0 < 0 ? 10 + d0 : d0) | ((d1 < 0 ? 10 + d1 : d1) << 4);

        state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
            (state.a & 0x80) |  // negative
            (state.a ? 0 : CpuInterface.Flags.z) |   // zero
            (d1 < 0 ? 0 : CpuInterface.Flags.c);     // carry / borrow
    } else {
        operand = (~operand & 0xFF);

        const sum = state.a + operand + (state.flags & CpuInterface.Flags.c),
            result = sum & 0xFF;

        state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c | CpuInterface.Flags.v)) |
            (result & 0x80) |  // negative
            (result ? 0 : CpuInterface.Flags.z) |   // zero
            (sum >>> 8) |         // carry / borrow
            (((~(operand ^ state.a) & (result ^ operand)) & 0x80) >>> 1); // overflow

        state.a = result;
    }
}

function opSec(state: CpuInterface.State): void {
    state.flags |= CpuInterface.Flags.c;
}

function opSed(state: CpuInterface.State): void {
    state.flags |= CpuInterface.Flags.d;
}

function opSei(state: CpuInterface.State): void {
    state.flags |= CpuInterface.Flags.i;
}

function opSta(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    bus.write(operand, state.a);
}

function opStx(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    bus.write(operand, state.x);
}

function opSty(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    bus.write(operand, state.y);
}

function opTax(state: CpuInterface.State): void {
    state.x = state.a;
    setFlagsNZ(state, state.a);
}

function opTay(state: CpuInterface.State): void {
    state.y = state.a;
    setFlagsNZ(state, state.a);
}

function opTsx(state: CpuInterface.State): void {
    state.x = state.s;
    setFlagsNZ(state, state.x);
}

function opTxa(state: CpuInterface.State): void {
    state.a = state.x;
    setFlagsNZ(state, state.a);
}

function opTxs(state: CpuInterface.State): void {
    state.s = state.x;
}

function opTya(state: CpuInterface.State): void {
    state.a = state.y;
    setFlagsNZ(state, state.a);
}

function opAlr(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = state.a;
    state.a = (state.a & operand) >>> 1;

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

function opAxs(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.x = ((state.a & state.x) + (~operand + 1)) & 0xFF;

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.x & 0x80) |
        ((state.x & 0xFF) ? 0 : CpuInterface.Flags.z) |
        (state.x >>> 8);
}

function opDcp(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const value = (bus.read(operand) + 0xFF) & 0xFF;
    bus.write(operand, value);

    const diff = state.a + (~value & 0xFF) + 1;

    state.flags = (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        ((diff & 0xFF) ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

function opLax(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a = operand;
    state.x = operand;
    setFlagsNZ(state, operand);
}

class Cpu {
    constructor(
        private _bus: BusInterface,
        private _rng?: RngInterface
    ) {
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

    setInvalidInstructionCallback(callback: CpuInterface.InvalidInstructionCallbackInterface): Cpu {
        this._invalidInstructionCallback = callback;
        return this;
    }

    getInvalidInstructionCallback(): CpuInterface.InvalidInstructionCallbackInterface {
        return this._invalidInstructionCallback;
    }

    getLastInstructionPointer(): number {
        return this._lastInstructionPointer;
    }

    reset(): Cpu {
        this.state.a = this._rng ? this._rng.int(0xFF) : 0;
        this.state.x = this._rng ? this._rng.int(0xFF) : 0;
        this.state.y = this._rng ? this._rng.int(0xFF) : 0;
        this.state.s = this._rng ? this._rng.int(0xFF) : 0;
        this.state.p = this._rng ? this._rng.int(0xFFFF) : 0;
        this.state.flags = (this._rng ? this._rng.int(0xFF) : 0) |
            CpuInterface.Flags.i | CpuInterface.Flags.e | CpuInterface.Flags.b;

        this.executionState = CpuInterface.ExecutionState.boot;
        this._opCycles = 7;
        this._interruptPending = false;
        this._nmiPending = false;

        this._instructionCallback = opBoot;

        return this;
    }

    cycle(): Cpu {
        switch (this.executionState) {
            case CpuInterface.ExecutionState.boot:
            case CpuInterface.ExecutionState.execute:
                if (--this._opCycles === 0) {
                    this._instructionCallback(this.state, this._bus, this._operand);
                    this.executionState = CpuInterface.ExecutionState.fetch;
                }

                break;

            case CpuInterface.ExecutionState.fetch:
                if (this._halted) break;

                // TODO: interrupt handling

                this._fetch();
        }

        return this;
    }

    private _fetch() {
        const instruction = Instruction.opcodes[this._bus.read(this.state.p)];

        let addressingMode = instruction.addressingMode,
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
                if (this.state.flags & CpuInterface.Flags.c) {
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
                if (this.state.flags & CpuInterface.Flags.c) {
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
                if (this.state.flags & CpuInterface.Flags.z) {
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
                if (this.state.flags & CpuInterface.Flags.n) {
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
                if (this.state.flags & CpuInterface.Flags.z) {
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
                if (this.state.flags & CpuInterface.Flags.n) {
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
                if (this.state.flags & CpuInterface.Flags.v) {
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
                if (this.state.flags & CpuInterface.Flags.v) {
                    this._instructionCallback = opJmp;
                    this._opCycles = 0;
                } else {
                    addressingMode = Instruction.AddressingMode.implied;
                    this._instructionCallback = opNop;
                    this.state.p = (this.state.p + 1) & 0xFFFF;
                    this._opCycles = 1;
                }
                break;

            case Instruction.Operation.brk:
                this._opCycles = 6;
                this._instructionCallback = opBrk;
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
            case Instruction.Operation.dop:
            case Instruction.Operation.top:
                if (addressingMode === Instruction.AddressingMode.immediate) {
                    this._opCycles = 0;
                } else {
                    this._opCycles = 1;
                }
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

            case Instruction.Operation.rti:
                this._opCycles = 5;
                this._instructionCallback = opRti;
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

            case Instruction.Operation.alr:
                this._opCycles = 0;
                this._instructionCallback = opAlr;
                break;

            case Instruction.Operation.axs:
                this._opCycles = 0;
                this._instructionCallback = opAxs;
                break;

            case Instruction.Operation.dcp:
                this._opCycles = 3;
                this._instructionCallback = opDcp;
                break;

            case Instruction.Operation.lax:
                this._opCycles = 0;
                this._instructionCallback = opLax;
                dereference = true;
                break;

            default:
                if (this._invalidInstructionCallback) this._invalidInstructionCallback(this);
                return;
        }

        this.state.p = (this.state.p + 1) & 0xFFFF;

        let value: number,
            base : number;

        switch (addressingMode) {
            case Instruction.AddressingMode.immediate:
                this._operand = this._bus.read(this.state.p);
                dereference = false;
                this.state.p = (this.state.p + 1) & 0xFFFF;
                this._opCycles++;
                break;

            case Instruction.AddressingMode.zeroPage:
                this._operand = this._bus.read(this.state.p);
                this.state.p = (this.state.p + 1) & 0xFFFF;
                this._opCycles++;
                break;

            case Instruction.AddressingMode.absolute:
                this._operand = this._bus.readWord(this.state.p);
                this.state.p = (this.state.p + 2) & 0xFFFF;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.indirect:
                value = this._bus.readWord(this.state.p);
                if ((value & 0xFF) === 0xFF)
                    this._operand = this._bus.read(value) + (this._bus.read(value & 0xFF00) << 8);
                else this._operand = this._bus.readWord(value);
                this.state.p = (this.state.p + 2) & 0xFFFF;
                this._opCycles += 4;
                break;

            case Instruction.AddressingMode.relative:
                value = this._bus.read(this.state.p);
                value = (value & 0x80) ? -(~(value - 1) & 0xFF) : value;
                this._operand = (this.state.p + value + 0x10001) & 0xFFFF;
                this._opCycles += (((this._operand & 0xFF00) !== (this.state.p & 0xFF00)) ? 3 : 2);
                this.state.p = (this.state.p + 1) & 0xFFFF;
                break;

            case Instruction.AddressingMode.zeroPageX:
                base = this._bus.read(this.state.p);
                this._bus.read(base);

                this._operand = (base + this.state.x) & 0xFF;
                this.state.p = (this.state.p + 1) & 0xFFFF;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.absoluteX:
                value = this._bus.readWord(this.state.p);
                this._operand = (value + this.state.x) & 0xFFFF;

                if ((this._operand & 0xFF00) !== (value & 0xFF00)) {
                    this._bus.read((value & 0xFF00) | (this._operand & 0xFF));
                }

                this._opCycles += ((slowIndexedAccess || (this._operand & 0xFF00) !== (value & 0xFF00)) ? 3 : 2);
                this.state.p = (this.state.p + 2) & 0xFFFF;
                break;

            case Instruction.AddressingMode.zeroPageY:
                base = this._bus.read(this.state.p);
                this._bus.read(base);

                this._operand = (base + this.state.y) & 0xFF;
                this.state.p = (this.state.p + 1) & 0xFFFF;
                this._opCycles += 2;
                break;

            case Instruction.AddressingMode.absoluteY:
                value = this._bus.readWord(this.state.p);
                this._operand = (value + this.state.y) & 0xFFFF;

                if ((this._operand & 0xFF00) !== (value & 0xFF00)) {
                    this._bus.read((value & 0xFF00) | (this._operand & 0xFF));
                }

                this._opCycles += ((slowIndexedAccess || (this._operand & 0xFF00) !== (value & 0xFF00)) ? 3 : 2);
                this.state.p = (this.state.p + 2) & 0xFFFF;
                break;

            case Instruction.AddressingMode.indexedIndirectX:
                base = this._bus.read(this.state.p);
                this._bus.read(base);

                value = (base + this.state.x) & 0xFF;

                if (value === 0xFF) {
                    this._operand = this._bus.read(0xFF) + (this._bus.read(0x00) << 8);
                } else {
                    this._operand = this._bus.readWord(value);
                }

                this._opCycles += 4;
                this.state.p = (this.state.p + 1) & 0xFFFF;
                break;

            case Instruction.AddressingMode.indirectIndexedY:
                value = this._bus.read(this.state.p);

                if (value === 0xFF) {
                    value = this._bus.read(0xFF) + (this._bus.read(0x00) << 8);
                } else {
                    value = this._bus.readWord(value);
                }

                this._operand = (value + this.state.y) & 0xFFFF;

                if ((this._operand & 0xFF00) !== (value & 0xFF00)) {
                    this._bus.read((value & 0xFF00) | (this._operand & 0xFF));
                }

                this._opCycles += ((slowIndexedAccess || (value & 0xFF00) !== (this._operand & 0xFF00)) ? 4 : 3);
                this.state.p = (this.state.p + 1) & 0xFFFF;
                break;
        }

        if (dereference) {
            this._operand = this._bus.read(this._operand);
            this._opCycles++;
        }

        this.executionState = CpuInterface.ExecutionState.execute;
    }

    executionState: CpuInterface.ExecutionState = CpuInterface.ExecutionState.boot;
    state: CpuInterface.State = new CpuInterface.State();

    private _opCycles: number = 0;
    private _instructionCallback: InstructionCallbackInterface = null;
    private _invalidInstructionCallback : CpuInterface.InvalidInstructionCallbackInterface = null;
    private _interruptPending: boolean = false;
    private _nmiPending: boolean = false;
    private _halted: boolean = false;
    private _operand: number = 0;
    private _lastInstructionPointer: number = 0;
}

interface InstructionCallbackInterface {
    (state?: CpuInterface.State, bus?: BusInterface, operand?: number): void;
}

export default Cpu;
