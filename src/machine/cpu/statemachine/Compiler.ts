/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import CpuInterface from '../CpuInterface';
import StateMachineInterface from './StateMachineInterface';
import Instruction from '../Instruction';
import {
    immediate,
    dereference,
    zeroPage,
    absolute,
    zeroPageX,
    zeroPageY,
    absoluteX,
    absoluteY,
    indexedIndirectX,
    indirectIndexedY
} from './addressing';
import { nullaryOneCycle, readModifyWrite, jsr, push, pull, rti, rts, write, branch } from './instruction';
import * as ops from './ops';
import { indirect } from './addressing/indirect';
import NextStep from './addressing/NextStep';
import { brk } from './vector';

class Compiler {
    constructor(private readonly _state: CpuInterface.State) {}

    compile(op: number): StateMachineInterface | null {
        const instruction = Instruction.opcodes[op];

        switch (instruction.operation) {
            case Instruction.Operation.adc:
                return this._createAddressing(instruction.addressingMode, ops.adc, {
                    deref: true
                });

            case Instruction.Operation.and:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => ops.genUnary(o, s, (operand, state) => (state.a = state.a & operand)),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.asl:
                return instruction.addressingMode === Instruction.AddressingMode.implied
                    ? nullaryOneCycle(this._state, ops.aslImmediate)
                    : this._createAddressing(
                          instruction.addressingMode,
                          readModifyWrite(this._state, ops.aslRmw).reset,
                          { writeOp: true }
                      );

            case Instruction.Operation.bit:
                return this._createAddressing(instruction.addressingMode, ops.bit, {
                    deref: true
                });

            case Instruction.Operation.brk:
                return brk(this._state);

            case Instruction.Operation.cmp:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => (ops.cmp(o, s, state => state.a), null),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.cpx:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => (ops.cmp(o, s, state => state.x), null),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.cpy:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => (ops.cmp(o, s, state => state.y), null),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.dec:
                return this._createAddressing(
                    instruction.addressingMode,
                    readModifyWrite(this._state, (s, o) => ops.genRmw(s, o, x => (x - 1) & 0xff)).reset,
                    {
                        writeOp: true
                    }
                );

            case Instruction.Operation.dex:
                return nullaryOneCycle(this._state, s => ops.genNullary(s, state => (state.x = (state.x - 1) & 0xff)));

            case Instruction.Operation.dey:
                return nullaryOneCycle(this._state, s => ops.genNullary(s, state => (state.y = (state.y - 1) & 0xff)));

            case Instruction.Operation.inc:
                return this._createAddressing(
                    instruction.addressingMode,
                    readModifyWrite(this._state, (s, o) => ops.genRmw(s, o, x => (x + 1) & 0xff)).reset,
                    {
                        writeOp: true
                    }
                );

            case Instruction.Operation.inx:
                return nullaryOneCycle(this._state, s => ops.genNullary(s, state => (state.x = (state.x + 1) & 0xff)));

            case Instruction.Operation.iny:
                return nullaryOneCycle(this._state, s => ops.genNullary(s, state => (state.y = (state.y + 1) & 0xff)));

            case Instruction.Operation.eor:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => ops.genUnary(o, s, (operand, state) => (state.a = state.a ^ operand)),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.jmp:
                return this._createAddressing(instruction.addressingMode, (o, s) => ((s.p = o), null));

            case Instruction.Operation.jsr:
                return jsr(this._state);

            case Instruction.Operation.lda:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => ops.genUnary(o, s, (operand, state) => (state.a = operand)),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.ldx:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => ops.genUnary(o, s, (operand, state) => (state.x = operand)),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.ldy:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => ops.genUnary(o, s, (operand, state) => (state.y = operand)),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.lsr:
                return instruction.addressingMode === Instruction.AddressingMode.implied
                    ? nullaryOneCycle(this._state, ops.lsrImmediate)
                    : this._createAddressing(
                          instruction.addressingMode,
                          readModifyWrite(this._state, ops.lsrRmw).reset,
                          { writeOp: true }
                      );

            case Instruction.Operation.nop:
                return nullaryOneCycle(this._state, () => undefined);

            case Instruction.Operation.ora:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => ops.genUnary(o, s, (operand, state) => (state.a |= operand)),
                    { deref: true }
                );

            case Instruction.Operation.pha:
                return push(this._state, s => s.a);

            case Instruction.Operation.php:
                return push(this._state, s => s.flags | CpuInterface.Flags.b);

            case Instruction.Operation.pla:
                return pull(this._state, (s, o) => ops.genNullary(s, state => (state.a = o)));

            case Instruction.Operation.plp:
                return pull(this._state, (s, o) => (s.flags = (o | CpuInterface.Flags.e) & ~CpuInterface.Flags.b));

            case Instruction.Operation.rol:
                return instruction.addressingMode === Instruction.AddressingMode.implied
                    ? nullaryOneCycle(this._state, ops.rolImmediate)
                    : this._createAddressing(
                          instruction.addressingMode,
                          readModifyWrite(this._state, ops.rolRmw).reset,
                          { writeOp: true }
                      );

            case Instruction.Operation.ror:
                return instruction.addressingMode === Instruction.AddressingMode.implied
                    ? nullaryOneCycle(this._state, ops.rorImmediate)
                    : this._createAddressing(
                          instruction.addressingMode,
                          readModifyWrite(this._state, ops.rorRmw).reset,
                          { writeOp: true }
                      );

            case Instruction.Operation.rti:
                return rti(this._state);

            case Instruction.Operation.rts:
                return rts(this._state);

            case Instruction.Operation.sbc:
                return this._createAddressing(instruction.addressingMode, ops.sbc, {
                    deref: true
                });

            case Instruction.Operation.stx:
                return this._createAddressing(instruction.addressingMode, write(this._state, s => s.x).reset, {
                    writeOp: true
                });

            case Instruction.Operation.sty:
                return this._createAddressing(instruction.addressingMode, write(this._state, s => s.y).reset, {
                    writeOp: true
                });

            case Instruction.Operation.tax:
                return nullaryOneCycle(this._state, s => ops.genNullary(s, state => (state.x = state.a)));

            case Instruction.Operation.tay:
                return nullaryOneCycle(this._state, s => ops.genNullary(s, state => (state.y = state.a)));

            case Instruction.Operation.tsx:
                return nullaryOneCycle(this._state, s => ops.genNullary(s, state => (state.x = state.s)));

            case Instruction.Operation.txa:
                return nullaryOneCycle(this._state, s => ops.genNullary(s, state => (state.a = state.x)));

            case Instruction.Operation.txs:
                return nullaryOneCycle(this._state, s => (s.s = s.x));

            case Instruction.Operation.tya:
                return nullaryOneCycle(this._state, s => ops.genNullary(s, state => (state.a = state.y)));

            // Bramches

            case Instruction.Operation.bcc:
                return branch(this._state, flags => (flags & CpuInterface.Flags.c) === 0);

            case Instruction.Operation.bcs:
                return branch(this._state, flags => (flags & CpuInterface.Flags.c) > 0);

            case Instruction.Operation.bne:
                return branch(this._state, flags => (flags & CpuInterface.Flags.z) === 0);

            case Instruction.Operation.beq:
                return branch(this._state, flags => (flags & CpuInterface.Flags.z) > 0);

            case Instruction.Operation.bpl:
                return branch(this._state, flags => (flags & CpuInterface.Flags.n) === 0);

            case Instruction.Operation.bmi:
                return branch(this._state, flags => (flags & CpuInterface.Flags.n) > 0);

            case Instruction.Operation.bvc:
                return branch(this._state, flags => (flags & CpuInterface.Flags.v) === 0);

            case Instruction.Operation.bvs:
                return branch(this._state, flags => (flags & CpuInterface.Flags.v) > 0);

            // Flags

            case Instruction.Operation.sec:
                return nullaryOneCycle(this._state, s => (s.flags |= CpuInterface.Flags.c));

            case Instruction.Operation.sed:
                return nullaryOneCycle(this._state, s => (s.flags |= CpuInterface.Flags.d));

            case Instruction.Operation.sei:
                return nullaryOneCycle(this._state, s => (s.flags |= CpuInterface.Flags.i));

            case Instruction.Operation.sta:
                return this._createAddressing(instruction.addressingMode, write(this._state, s => s.a).reset, {
                    writeOp: true
                });

            case Instruction.Operation.clc:
                return nullaryOneCycle(this._state, s => (s.flags &= ~CpuInterface.Flags.c));

            case Instruction.Operation.cld:
                return nullaryOneCycle(this._state, s => (s.flags &= ~CpuInterface.Flags.d));

            case Instruction.Operation.cli:
                return nullaryOneCycle(this._state, s => (s.flags &= ~CpuInterface.Flags.i));

            case Instruction.Operation.clv:
                return nullaryOneCycle(this._state, s => (s.flags &= ~CpuInterface.Flags.v));

            // Undocumented opcodes

            case Instruction.Operation.dop:
            case Instruction.Operation.top:
                return this._createAddressing(instruction.addressingMode, () => null, { deref: true });

            case Instruction.Operation.aac:
                return this._createAddressing(instruction.addressingMode, ops.aac);

            case Instruction.Operation.aax:
                return this._createAddressing(instruction.addressingMode, write(this._state, ops.aax).reset, {
                    writeOp: true
                });

            case Instruction.Operation.alr:
                return this._createAddressing(instruction.addressingMode, ops.alr, {
                    deref: true
                });

            case Instruction.Operation.arr:
                return this._createAddressing(instruction.addressingMode, (o, s) => (ops.arr(o, s), null), {
                    deref: true
                });

            case Instruction.Operation.axs:
                return this._createAddressing(instruction.addressingMode, ops.axs, {
                    deref: true
                });

            case Instruction.Operation.atx:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => ops.genUnary(o, s, (operand, state) => (state.x = state.a = state.a & operand)),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.dcp:
                return this._createAddressing(instruction.addressingMode, readModifyWrite(this._state, ops.dcp).reset, {
                    writeOp: true
                });

            case Instruction.Operation.isc:
                return this._createAddressing(instruction.addressingMode, readModifyWrite(this._state, ops.isc).reset, {
                    writeOp: true
                });

            case Instruction.Operation.lax:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => ops.genUnary(o, s, (operand, state) => (state.a = state.x = operand)),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.lar:
                return this._createAddressing(
                    instruction.addressingMode,
                    (o, s) => ops.genUnary(o, s, (operand, state) => (state.s = state.x = state.a = state.s & operand)),
                    { deref: true }
                );

            case Instruction.Operation.rla:
                return this._createAddressing(instruction.addressingMode, readModifyWrite(this._state, ops.rla).reset, {
                    writeOp: true
                });

            case Instruction.Operation.rra:
                return this._createAddressing(instruction.addressingMode, readModifyWrite(this._state, ops.rra).reset, {
                    writeOp: true
                });

            case Instruction.Operation.slo:
                return this._createAddressing(instruction.addressingMode, readModifyWrite(this._state, ops.slo).reset, {
                    writeOp: true
                });

            default:
                return null;
        }
    }

    private _createAddressing(
        addressingMode: Instruction.AddressingMode,
        next: NextStep,
        { deref = false, writeOp = false } = {}
    ): StateMachineInterface {
        if (deref && addressingMode !== Instruction.AddressingMode.immediate) {
            next = dereference(this._state, next).reset;
        }

        switch (addressingMode) {
            case Instruction.AddressingMode.immediate:
                return immediate(this._state, next);

            case Instruction.AddressingMode.zeroPage:
                return zeroPage(this._state, next);

            case Instruction.AddressingMode.absolute:
                return absolute(this._state, next);

            case Instruction.AddressingMode.zeroPageX:
                return zeroPageX(this._state, next);

            case Instruction.AddressingMode.zeroPageY:
                return zeroPageY(this._state, next);

            case Instruction.AddressingMode.absoluteX:
                return absoluteX(this._state, next, writeOp);

            case Instruction.AddressingMode.absoluteY:
                return absoluteY(this._state, next, writeOp);

            case Instruction.AddressingMode.indexedIndirectX:
                return indexedIndirectX(this._state, next);

            case Instruction.AddressingMode.indirectIndexedY:
                return indirectIndexedY(this._state, next, writeOp);

            case Instruction.AddressingMode.indirect:
                return indirect(this._state, next);

            default:
                throw new Error(`invalid addressing mode ${addressingMode}`);
        }
    }
}

export default Compiler;
