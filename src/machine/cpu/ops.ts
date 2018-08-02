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

import CpuInterface from './CpuInterface';
import BusInterface from '../bus/BusInterface';
import Instruction from './Instruction';

function restoreFlagsFromStack(state: CpuInterface.State, bus: BusInterface): void {
    state.s = (state.s + 0x01) & 0xff;
    state.flags = (bus.read(0x0100 + state.s) | CpuInterface.Flags.e) & ~CpuInterface.Flags.b;
}

function setFlagsNZ(state: CpuInterface.State, operand: number): void {
    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z)) |
        (operand & 0x80) |
        (operand ? 0 : CpuInterface.Flags.z);
}

export function opAdc(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    if (state.flags & CpuInterface.Flags.d) {
        const d0 = (operand & 0x0f) + (state.a & 0x0f) + (state.flags & CpuInterface.Flags.c),
            d1 = (operand >>> 4) + (state.a >>> 4) + (d0 > 9 ? 1 : 0);

        state.a = d0 % 10 | (d1 % 10 << 4);

        state.flags =
            (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
            (state.a & 0x80) | // negative
            (state.a ? 0 : CpuInterface.Flags.z) | // zero
            (d1 > 9 ? CpuInterface.Flags.c : 0); // carry
    } else {
        const sum = state.a + operand + (state.flags & CpuInterface.Flags.c),
            result = sum & 0xff;

        state.flags =
            (state.flags &
                ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c | CpuInterface.Flags.v)) |
            (result & 0x80) | // negative
            (result ? 0 : CpuInterface.Flags.z) | // zero
            (sum >>> 8) | // carry
            ((~(operand ^ state.a) & (result ^ operand) & 0x80) >>> 1); // overflow

        state.a = result;
    }
}

export function opAnd(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a &= operand;
    setFlagsNZ(state, state.a);
}

export function opAslAcc(state: CpuInterface.State): void {
    const old = state.a;
    state.a = (state.a << 1) & 0xff;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

export function opAslMem(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = (old << 1) & 0xff;
    bus.write(operand, value);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

export function opBit(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.v | CpuInterface.Flags.z)) |
        (operand & (CpuInterface.Flags.n | CpuInterface.Flags.v)) |
        (operand & state.a ? 0 : CpuInterface.Flags.z);
}

export function opBrk(state: CpuInterface.State, bus: BusInterface): void {
    const nextOpAddr = (state.p + 1) & 0xffff;
    let vector = 0xfffe;

    if (state.nmi) {
        vector = 0xfffa;
        state.nmi = false;
    }

    state.nmi = state.irq = false;

    bus.write(state.s + 0x0100, (nextOpAddr >>> 8) & 0xff);
    state.s = (state.s + 0xff) & 0xff;
    bus.write(state.s + 0x0100, nextOpAddr & 0xff);
    state.s = (state.s + 0xff) & 0xff;

    bus.write(state.s + 0x0100, state.flags | CpuInterface.Flags.b);
    state.s = (state.s + 0xff) & 0xff;

    state.flags |= CpuInterface.Flags.i;

    state.p = bus.readWord(vector);
}

export function opClc(state: CpuInterface.State): void {
    state.flags &= ~CpuInterface.Flags.c;
}

export function opCld(state: CpuInterface.State): void {
    state.flags &= ~CpuInterface.Flags.d;
}

export function opCli(state: CpuInterface.State): void {
    state.flags &= ~CpuInterface.Flags.i;
}

export function opClv(state: CpuInterface.State): void {
    state.flags &= ~CpuInterface.Flags.v;
}

export function opCmp(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const diff = state.a + (~operand & 0xff) + 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        (diff & 0xff ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

export function opCpx(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const diff = state.x + (~operand & 0xff) + 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        (diff & 0xff ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

export function opCpy(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const diff = state.y + (~operand & 0xff) + 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        (diff & 0xff ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

export function opDec(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const value = (bus.read(operand) + 0xff) & 0xff;
    bus.write(operand, value);
    setFlagsNZ(state, value);
}

export function opDex(state: CpuInterface.State): void {
    state.x = (state.x + 0xff) & 0xff;
    setFlagsNZ(state, state.x);
}

export function opEor(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a = state.a ^ operand;
    setFlagsNZ(state, state.a);
}

export function opDey(state: CpuInterface.State): void {
    state.y = (state.y + 0xff) & 0xff;
    setFlagsNZ(state, state.y);
}

export function opInc(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const value = (bus.read(operand) + 1) & 0xff;
    bus.write(operand, value);
    setFlagsNZ(state, value);
}

export function opInx(state: CpuInterface.State): void {
    state.x = (state.x + 0x01) & 0xff;
    setFlagsNZ(state, state.x);
}

export function opIny(state: CpuInterface.State): void {
    state.y = (state.y + 0x01) & 0xff;
    setFlagsNZ(state, state.y);
}

export function opJmp(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.p = operand;
}

export function opJsr(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const returnPtr = (state.p + 1) & 0xffff,
        addrLo = bus.read(state.p);

    bus.read(0x0100 + state.s);
    bus.write(0x0100 + state.s, returnPtr >>> 8);
    state.s = (state.s + 0xff) & 0xff;
    bus.write(0x0100 + state.s, returnPtr & 0xff);
    state.s = (state.s + 0xff) & 0xff;

    state.p = addrLo | (bus.read((state.p + 1) & 0xffff) << 8);
}

export function opLda(
    state: CpuInterface.State,
    bus: BusInterface,
    operand: number,
    addressingMode: Instruction.AddressingMode
): void {
    state.a = addressingMode === Instruction.AddressingMode.immediate ? operand : bus.read(operand);
    setFlagsNZ(state, state.a);
}

export function opLdx(
    state: CpuInterface.State,
    bus: BusInterface,
    operand: number,
    addressingMode: Instruction.AddressingMode
): void {
    state.x = addressingMode === Instruction.AddressingMode.immediate ? operand : bus.read(operand);
    setFlagsNZ(state, state.x);
}

export function opLdy(
    state: CpuInterface.State,
    bus: BusInterface,
    operand: number,
    addressingMode: Instruction.AddressingMode
): void {
    state.y = addressingMode === Instruction.AddressingMode.immediate ? operand : bus.read(operand);
    setFlagsNZ(state, state.y);
}

export function opLsrAcc(state: CpuInterface.State): void {
    const old = state.a;
    state.a = state.a >>> 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

export function opLsrMem(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = old >>> 1;
    bus.write(operand, value);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

export function opNop(): void {}

export function opOra(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a |= operand;
    setFlagsNZ(state, state.a);
}

export function opPhp(state: CpuInterface.State, bus: BusInterface): void {
    bus.write(0x0100 + state.s, state.flags | CpuInterface.Flags.b);
    state.s = (state.s + 0xff) & 0xff;
}

export function opPlp(state: CpuInterface.State, bus: BusInterface): void {
    restoreFlagsFromStack(state, bus);
}

export function opPha(state: CpuInterface.State, bus: BusInterface): void {
    bus.write(0x0100 + state.s, state.a);
    state.s = (state.s + 0xff) & 0xff;
}

export function opPla(state: CpuInterface.State, bus: BusInterface): void {
    state.s = (state.s + 0x01) & 0xff;
    state.a = bus.read(0x0100 + state.s);
    setFlagsNZ(state, state.a);
}

export function opRolAcc(state: CpuInterface.State): void {
    const old = state.a;
    state.a = ((state.a << 1) & 0xff) | (state.flags & CpuInterface.Flags.c);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

export function opRolMem(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = ((old << 1) & 0xff) | (state.flags & CpuInterface.Flags.c);
    bus.write(operand, value);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

export function opRorAcc(state: CpuInterface.State): void {
    const old = state.a;
    state.a = (state.a >>> 1) | ((state.flags & CpuInterface.Flags.c) << 7);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

export function opRorMem(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = (old >>> 1) | ((state.flags & CpuInterface.Flags.c) << 7);
    bus.write(operand, value);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (value & 0x80) |
        (value ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

export function opRti(state: CpuInterface.State, bus: BusInterface): void {
    let returnPtr: number;

    restoreFlagsFromStack(state, bus);

    state.s = (state.s + 1) & 0xff;
    returnPtr = bus.read(0x0100 + state.s);
    state.s = (state.s + 1) & 0xff;
    returnPtr |= bus.read(0x0100 + state.s) << 8;

    state.p = returnPtr;
}

export function opRts(state: CpuInterface.State, bus: BusInterface): void {
    let returnPtr: number;

    bus.read(0x0100 + state.s);
    state.s = (state.s + 1) & 0xff;
    returnPtr = bus.read(0x0100 + state.s);
    state.s = (state.s + 1) & 0xff;
    returnPtr += bus.read(0x0100 + state.s) << 8;

    state.p = (returnPtr + 1) & 0xffff;
}

export function opSbc(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    if (state.flags & CpuInterface.Flags.d) {
        const d0 = (state.a & 0x0f) - (operand & 0x0f) - (~state.flags & CpuInterface.Flags.c),
            d1 = (state.a >>> 4) - (operand >>> 4) - (d0 < 0 ? 1 : 0);

        state.a = (d0 < 0 ? 10 + d0 : d0) | ((d1 < 0 ? 10 + d1 : d1) << 4);

        state.flags =
            (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
            (state.a & 0x80) | // negative
            (state.a ? 0 : CpuInterface.Flags.z) | // zero
            (d1 < 0 ? 0 : CpuInterface.Flags.c); // carry / borrow
    } else {
        operand = ~operand & 0xff;

        const sum = state.a + operand + (state.flags & CpuInterface.Flags.c),
            result = sum & 0xff;

        state.flags =
            (state.flags &
                ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c | CpuInterface.Flags.v)) |
            (result & 0x80) | // negative
            (result ? 0 : CpuInterface.Flags.z) | // zero
            (sum >>> 8) | // carry / borrow
            ((~(operand ^ state.a) & (result ^ operand) & 0x80) >>> 1); // overflow

        state.a = result;
    }
}

export function opSec(state: CpuInterface.State): void {
    state.flags |= CpuInterface.Flags.c;
}

export function opSed(state: CpuInterface.State): void {
    state.flags |= CpuInterface.Flags.d;
}

export function opSei(state: CpuInterface.State): void {
    state.flags |= CpuInterface.Flags.i;
}

export function opSta(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    bus.write(operand, state.a);
}

export function opStx(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    bus.write(operand, state.x);
}

export function opSty(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    bus.write(operand, state.y);
}

export function opTax(state: CpuInterface.State): void {
    state.x = state.a;
    setFlagsNZ(state, state.a);
}

export function opTay(state: CpuInterface.State): void {
    state.y = state.a;
    setFlagsNZ(state, state.a);
}

export function opTsx(state: CpuInterface.State): void {
    state.x = state.s;
    setFlagsNZ(state, state.x);
}

export function opTxa(state: CpuInterface.State): void {
    state.a = state.x;
    setFlagsNZ(state, state.a);
}

export function opTxs(state: CpuInterface.State): void {
    state.s = state.x;
}

export function opTya(state: CpuInterface.State): void {
    state.a = state.y;
    setFlagsNZ(state, state.a);
}

export function opAlr(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const i = state.a & operand;
    state.a = i >>> 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (i & CpuInterface.Flags.c);
}

export function opAxs(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const value = (state.a & state.x) + (~operand & 0xff) + 1;

    state.x = value & 0xff;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.x & 0x80) |
        (state.x & 0xff ? 0 : CpuInterface.Flags.z) |
        (value >>> 8);
}

export function opDcp(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const value = (bus.read(operand) + 0xff) & 0xff;
    bus.write(operand, value);

    const diff = state.a + (~value & 0xff) + 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        (diff & 0xff ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

export function opLax(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a = operand;
    state.x = operand;
    setFlagsNZ(state, operand);
}

export function opArr(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a = ((state.a & operand) >>> 1) | (state.flags & CpuInterface.Flags.c ? 0x80 : 0);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.c | CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.v)) |
        ((state.a & 0x40) >>> 6) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (state.a & 0x80) |
        ((state.a & 0x40) ^ ((state.a & 0x20) << 1));
}

export function opSlo(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    let value = bus.read(operand);
    state.flags = (state.flags & ~CpuInterface.Flags.c) | (value >>> 7);
    value = value << 1;

    bus.write(operand, value);

    state.a = state.a | value;
    setFlagsNZ(state, state.a);
}

export function opAax(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const value = state.x & state.a;
    bus.write(operand, value);
    setFlagsNZ(state, value);
}

export function opLar(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.s = state.a = state.x = state.s & operand;
    setFlagsNZ(state, state.a);
}

export function opIsc(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const value = (bus.read(operand) + 1) & 0xff;
    bus.write(operand, value);

    opSbc(state, bus, value);
}

export function opAac(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a &= operand;
    setFlagsNZ(state, state.a);
    state.flags = (state.flags & ~CpuInterface.Flags.c) | ((state.a & 0x80) >>> 7);
}

export function opAtx(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    state.a &= operand;
    state.x = state.a;
    setFlagsNZ(state, state.a);
}

export function opRra(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = (old >>> 1) | ((state.flags & CpuInterface.Flags.c) << 7);
    bus.write(operand, value);

    state.flags = (state.flags & ~CpuInterface.Flags.c) | (old & CpuInterface.Flags.c);

    opAdc(state, bus, value);
}

export function opRla(state: CpuInterface.State, bus: BusInterface, operand: number): void {
    const old = bus.read(operand),
        value = ((old << 1) & 0xff) | (state.flags & CpuInterface.Flags.c);
    bus.write(operand, value);

    state.flags = (state.flags & ~CpuInterface.Flags.c) | (old >>> 7);

    opAnd(state, bus, value);
}
