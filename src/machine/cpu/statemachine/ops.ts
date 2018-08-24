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

function setFlagsNZ(state: CpuInterface.State, operand: number): void {
    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z)) |
        (operand & 0x80) |
        (operand ? 0 : CpuInterface.Flags.z);
}

export function adc(state: CpuInterface.State, operand: number): void {
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

export function and(state: CpuInterface.State, operand: number): void {
    state.a &= operand;
    setFlagsNZ(state, state.a);
}

export function aslImmediate(state: CpuInterface.State): void {
    const old = state.a;
    state.a = (state.a << 1) & 0xff;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

export function aslRMW(state: CpuInterface.State, operand: number): number {
    const result = (operand << 1) & 0xff;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (result & 0x80) |
        (result ? 0 : CpuInterface.Flags.z) |
        (operand >>> 7);

    return result;
}

export function bit(state: CpuInterface.State, operand: number): void {
    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.v | CpuInterface.Flags.z)) |
        (operand & (CpuInterface.Flags.n | CpuInterface.Flags.v)) |
        (operand & state.a ? 0 : CpuInterface.Flags.z);
}

export function cmp(
    state: CpuInterface.State,
    operand: number,
    getRegister: (state: CpuInterface.State) => number
): void {
    const diff = getRegister(state) + (~operand & 0xff) + 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        (diff & 0xff ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

export function dec(state: CpuInterface.State, operand: number): number {
    const result = (operand + 0xff) & 0xff;
    setFlagsNZ(state, result);

    return result;
}

export function sbc(state: CpuInterface.State, operand: number): void {
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
