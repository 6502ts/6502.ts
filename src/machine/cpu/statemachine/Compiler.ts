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
import { nullaryOneCycle, readModifyWrite, brk, jsr, push, pull, rti, rts, write, branch } from './instruction';
import * as ops from './ops';
import { indirect } from './addressing/indirect';

class Compiler {
    constructor(private readonly _state: CpuInterface.State) {}

    compile(op: number): StateMachineInterface | null {
        const instruction = Instruction.opcodes[op];

        switch (instruction.operation) {
            case Instruction.Operation.adc:
                return this._createAddressing(instruction.addressingMode, o => (ops.adc(this._state, o), null), {
                    deref: true
                });

            case Instruction.Operation.and:
                return this._createAddressing(
                    instruction.addressingMode,
                    o => (ops.genUnary(this._state, o, (state, operand) => (state.a = state.a & operand)), null),
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

            case Instruction.Operation.bit:
                return this._createAddressing(instruction.addressingMode, o => (ops.bit(this._state, o), null), {
                    deref: true
                });

            case Instruction.Operation.brk:
                return brk(this._state);

            case Instruction.Operation.clc:
                return nullaryOneCycle(this._state, s => (s.flags &= ~CpuInterface.Flags.c));

            case Instruction.Operation.cld:
                return nullaryOneCycle(this._state, s => (s.flags &= ~CpuInterface.Flags.d));

            case Instruction.Operation.cli:
                return nullaryOneCycle(this._state, s => (s.flags &= ~CpuInterface.Flags.i));

            case Instruction.Operation.clv:
                return nullaryOneCycle(this._state, s => (s.flags &= ~CpuInterface.Flags.v));

            case Instruction.Operation.cmp:
                return this._createAddressing(
                    instruction.addressingMode,
                    o => (ops.cmp(this._state, o, s => s.a), null),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.cpx:
                return this._createAddressing(
                    instruction.addressingMode,
                    o => (ops.cmp(this._state, o, s => s.x), null),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.cpy:
                return this._createAddressing(
                    instruction.addressingMode,
                    o => (ops.cmp(this._state, o, s => s.y), null),
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
                    o => (ops.genUnary(this._state, o, (state, operand) => (state.a = state.a ^ operand)), null),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.jmp:
                return this._createAddressing(instruction.addressingMode, o => ((this._state.p = o), null));

            case Instruction.Operation.jsr:
                return jsr(this._state);

            case Instruction.Operation.lda:
                return this._createAddressing(
                    instruction.addressingMode,
                    o => (ops.genUnary(this._state, o, (state, operand) => (state.a = operand)), null),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.ldx:
                return this._createAddressing(
                    instruction.addressingMode,
                    o => (ops.genUnary(this._state, o, (state, operand) => (state.x = operand)), null),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.ldy:
                return this._createAddressing(
                    instruction.addressingMode,
                    o => (ops.genUnary(this._state, o, (state, operand) => (state.y = operand)), null),
                    {
                        deref: true
                    }
                );

            case Instruction.Operation.sbc:
                return this._createAddressing(instruction.addressingMode, o => (ops.sbc(this._state, o), null), {
                    deref: true
                });

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
                    o => (ops.genUnary(this._state, o, (state, operand) => (state.a |= operand)), null),
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

            default:
                return null;
        }
    }

    private _createAddressing(
        addressingMode: Instruction.AddressingMode,
        next: (operand: number) => StateMachineInterface.Result,
        { deref = false, writeOp = false } = {}
    ): StateMachineInterface {
        if (deref && addressingMode !== Instruction.AddressingMode.immediate) {
            next = dereference(next).reset;
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
