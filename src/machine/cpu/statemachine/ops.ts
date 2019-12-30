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

function setFlagsNZ(operand: number, state: CpuInterface.State): void {
    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z)) |
        (operand & 0x80) |
        (operand ? 0 : CpuInterface.Flags.z);
}

export function genRmw(operand: number, state: CpuInterface.State, operation: (x: number) => number): number {
    const result = operation(operand);
    setFlagsNZ(result, state);

    return result;
}

export function genNullary(state: CpuInterface.State, operation: (state: CpuInterface.State) => number): void {
    setFlagsNZ(operation(state), state);
}

export function genUnary(
    operand: number,
    state: CpuInterface.State,
    operation: (operand: number, state: CpuInterface.State) => number
): null {
    setFlagsNZ(operation(operand, state), state);

    return null;
}

export function adc(operand: number, state: CpuInterface.State): null {
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

    return null;
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

export function aslRmw(operand: number, state: CpuInterface.State): number {
    const result = (operand << 1) & 0xff;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (result & 0x80) |
        (result ? 0 : CpuInterface.Flags.z) |
        (operand >>> 7);

    return result;
}

export function bit(operand: number, state: CpuInterface.State): null {
    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.v | CpuInterface.Flags.z)) |
        (operand & (CpuInterface.Flags.n | CpuInterface.Flags.v)) |
        (operand & state.a ? 0 : CpuInterface.Flags.z);

    return null;
}

export function cmp(
    operand: number,
    state: CpuInterface.State,
    getRegister: (state: CpuInterface.State) => number
): void {
    const diff = getRegister(state) + (~operand & 0xff) + 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        (diff & 0xff ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);
}

export function sbc(operand: number, state: CpuInterface.State): null {
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

    return null;
}

export function lsrImmediate(state: CpuInterface.State): void {
    const old = state.a;
    state.a = state.a >>> 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

export function lsrRmw(operand: number, state: CpuInterface.State): number {
    const result = operand >>> 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (result & 0x80) |
        (result ? 0 : CpuInterface.Flags.z) |
        (operand & CpuInterface.Flags.c);

    return result;
}

export function rolImmediate(state: CpuInterface.State): void {
    const old = state.a;
    state.a = ((state.a << 1) & 0xff) | (state.flags & CpuInterface.Flags.c);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old >>> 7);
}

export function rolRmw(operand: number, state: CpuInterface.State): number {
    const result = ((operand << 1) & 0xff) | (state.flags & CpuInterface.Flags.c);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (result & 0x80) |
        (result ? 0 : CpuInterface.Flags.z) |
        (operand >>> 7);

    return result;
}

export function rorImmediate(state: CpuInterface.State): void {
    const old = state.a;
    state.a = (state.a >>> 1) | ((state.flags & CpuInterface.Flags.c) << 7);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (old & CpuInterface.Flags.c);
}

export function rorRmw(operand: number, state: CpuInterface.State): number {
    const result = (operand >>> 1) | ((state.flags & CpuInterface.Flags.c) << 7);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (result & 0x80) |
        (result ? 0 : CpuInterface.Flags.z) |
        (operand & CpuInterface.Flags.c);

    return result;
}

// Undocumented opcodes

export function arr(operand: number, state: CpuInterface.State): void {
    state.a = ((state.a & operand) >>> 1) | (state.flags & CpuInterface.Flags.c ? 0x80 : 0);

    state.flags =
        (state.flags & ~(CpuInterface.Flags.c | CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.v)) |
        ((state.a & 0x40) >>> 6) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (state.a & 0x80) |
        ((state.a & 0x40) ^ ((state.a & 0x20) << 1));
}

export function alr(operand: number, state: CpuInterface.State): null {
    const i = state.a & operand;
    state.a = i >>> 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.a & 0x80) |
        (state.a ? 0 : CpuInterface.Flags.z) |
        (i & CpuInterface.Flags.c);

    return null;
}

export function dcp(operand: number, state: CpuInterface.State): number {
    const result = (operand + 0xff) & 0xff;
    const diff = state.a + (~result & 0xff) + 1;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (diff & 0x80) |
        (diff & 0xff ? 0 : CpuInterface.Flags.z) |
        (diff >>> 8);

    return result;
}

export function axs(operand: number, state: CpuInterface.State): null {
    const value = (state.a & state.x) + (~operand & 0xff) + 1;

    state.x = value & 0xff;

    state.flags =
        (state.flags & ~(CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.c)) |
        (state.x & 0x80) |
        (state.x & 0xff ? 0 : CpuInterface.Flags.z) |
        (value >>> 8);

    return null;
}

export function rra(operand: number, state: CpuInterface.State): number {
    const result = (operand >>> 1) | ((state.flags & CpuInterface.Flags.c) << 7);

    state.flags = (state.flags & ~CpuInterface.Flags.c) | (operand & CpuInterface.Flags.c);

    adc(result, state);

    return result;
}

export function rla(operand: number, state: CpuInterface.State): number {
    const result = ((operand << 1) & 0xff) | (state.flags & CpuInterface.Flags.c);

    state.flags = (state.flags & ~CpuInterface.Flags.c) | (operand >>> 7);

    setFlagsNZ((state.a &= result), state);

    return result;
}

export function slo(operand: number, state: CpuInterface.State): number {
    state.flags = (state.flags & ~CpuInterface.Flags.c) | (operand >>> 7);
    const result = (operand << 1) & 0xff;

    state.a = state.a | result;
    setFlagsNZ(state.a, state);

    return result;
}

export function aax(state: CpuInterface.State): number {
    const result = state.a & state.x;
    setFlagsNZ(result, state);

    return result;
}

export function isc(operand: number, state: CpuInterface.State): number {
    const result = (operand + 1) & 0xff;

    sbc(result, state);

    return result;
}

export function aac(operand: number, state: CpuInterface.State): null {
    state.a &= operand;
    setFlagsNZ(state.a, state);
    state.flags = (state.flags & ~CpuInterface.Flags.c) | ((state.a & 0x80) >>> 7);

    return null;
}
