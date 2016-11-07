/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

import Runner from './Runner';
import CpuInterface from '../../../../src/machine/cpu/CpuInterface';
import * as hex from '../../../../src/tools/hex';
import * as util from './util';

function testAdc(
    in1: number,
    in2: number,
    out: number,
    flags = 0,
    flagsDontcare = 0,
    carry = false
): void {
    test(
        `immediate: ${hex.encode(in1, 2)} + ${hex.encode(in2, 2)} ` +
            `${carry ? '+ c ' : ''}= ${hex.encode(out, 2)}`,

        function() {
            const runner = Runner
                .create([0x69, in1])
                .setState({
                    a: in2,
                    flags: CpuInterface.Flags.e | (carry ? CpuInterface.Flags.c : 0)
                });

            runner
                .run()
                .assertCycles(2)
                .assertState({
                    a: out,
                    flags: ((CpuInterface.Flags.e | flags) & ~flagsDontcare) |
                        (runner.getCpu().state.flags & flagsDontcare)
                });
        }
    );
}

function testAdcNeg(
    in1: number,
    in2: number,
    out: number,
    flags = 0,
    flagsDontcare = 0,
    carry = false
): void {
    test(
        `immediate: ${hex.encode(in1, 2)} + ${hex.encode(in2, 2)} ` +
            `${carry ? '+ c ' : ''}= ${hex.encode(out, 2)}`,

        function() {
            in1 = in1 >= 0 ? in1 : (~Math.abs(in1) & 0xFF) + 1;
            in2 = in2 >= 0 ? in2 : (~Math.abs(in2) & 0xFF) + 1;
            out = out >= 0 ? out : (~Math.abs(out) & 0xFF) + 1;

            const runner = Runner
                .create([0x69, in1])
                .setState({
                    a: in2,
                    flags: CpuInterface.Flags.e | (carry ? CpuInterface.Flags.c : 0)
                })
                .run();

            runner
                .assertCycles(2)
                .assertState({
                    a: out,
                    flags: ((CpuInterface.Flags.e | flags) & ~flagsDontcare) |
                        (runner.getCpu().state.flags & flagsDontcare)
                });
        }
    );
}

function testAdcBcd(
    in1: number,
    in2: number,
    out: number,
    flags = 0,
    flagsDontcare = 0,
    carry = false
) {
    test(
        `immediate, BCD: ${hex.encode(in1, 2)} + ${hex.encode(in2, 2)} ` +
            `${carry ? '+ c ' : ''}= ${hex.encode(out, 2)}`,

        function () {
            const runner = Runner
                .create([0x69, in1])
                .setState({
                    a: in2,
                    flags: CpuInterface.Flags.d | (carry ? CpuInterface.Flags.c : 0)
                });

            runner
                .run()
                .assertCycles(2)
                .assertState({
                    a: out,
                    flags: ((CpuInterface.Flags.d | flags) & ~flagsDontcare) |
                        (runner.getCpu().state.flags & (flagsDontcare | CpuInterface.Flags.v))
                });
        }
    );
}


function testSbc(
    opcode: number,
    in1: number,
    in2: number,
    out: number,
    flags = 0,
    flagsDontcare = 0,
    borrow = false
) {
    test(
        `immediate: ${hex.encode(in1, 2)} - ${hex.encode(in2, 2)} ` +
            `${borrow ? '- b ' : ''}= ${hex.encode(out, 2)}`,

    function () {
            const runner = Runner
                .create([opcode, in2])
                .setState({
                    a: in1,
                    flags: CpuInterface.Flags.e | (borrow ? 0 : CpuInterface.Flags.c)
                });

            runner
                .run()
                .assertCycles(2)
                .assertState({
                    a: out,
                    flags: ((CpuInterface.Flags.e | flags) & ~flagsDontcare) |
                        (runner.getCpu().state.flags & (flagsDontcare | CpuInterface.Flags.v))
                });
        }
    );
}

function testSbcBcd(
    opcode: number,
    in1: number,
    in2: number,
    out: number,
    flags: number,
    flagsDontcare = 0,
    borrow = false
) {
    test(
        `immediate, BCD: ${hex.encode(in1, 2)} - ${hex.encode(in2, 2)} ` +
            `${borrow ? '- b ' : ''}= ${hex.encode(out, 2)}`,

        function() {
            const runner = Runner
                .create([opcode, in2])
                .setState({
                    a: in1,
                    flags: CpuInterface.Flags.d | (borrow ? 0 : CpuInterface.Flags.c)
                });

            runner
                .run()
                .assertCycles(2)
                .assertState({
                    a: out,
                    flags: ((CpuInterface.Flags.d | flags) & ~flagsDontcare) |
                        (runner.getCpu().state.flags & (flagsDontcare | CpuInterface.Flags.v))
                });
        }
    );
}

export function run(): void {
    suite('ADC', function() {
        testAdc(0x01, 0x30, 0x31, 0, CpuInterface.Flags.v);
        testAdc(0x01, 0x30, 0x32, 0, CpuInterface.Flags.v, true);
        testAdc(0xFE, 0x02, 0x00, CpuInterface.Flags.c | CpuInterface.Flags.z, CpuInterface.Flags.v);
        testAdc(0x80, 0x70, 0xF0, CpuInterface.Flags.n);
        testAdcNeg(0x01, -0x01, 0x00, CpuInterface.Flags.z, CpuInterface.Flags.c);
        testAdcNeg(-0x71, 0x61, -0x10, CpuInterface.Flags.n, CpuInterface.Flags.c);
        testAdcNeg(-0x71, -0x61, 0x2E, CpuInterface.Flags.v, CpuInterface.Flags.c);
        testAdcNeg(0x7F, 0x7F, 0xFE, CpuInterface.Flags.v | CpuInterface.Flags.n, CpuInterface.Flags.c);
        testAdcBcd(0x03, 0x08, 0x11);
        testAdcBcd(0x23, 0x44, 0x67);
        testAdcBcd(0x76, 0x43, 0x19, CpuInterface.Flags.c);
        testAdcBcd(0x77, 0x23, 0x00, CpuInterface.Flags.z | CpuInterface.Flags.c);
        testAdcBcd(0x50, 0x44, 0x94, CpuInterface.Flags.n);

        util.testDereferencingZeropage(0x65, 0x12, 3, {a: 0x23}, {a: 0x35});
        util.testDereferencingZeropageX(0x75, 0x12, 4, {a: 0x23}, {a: 0x35});
        util.testDereferencingAbsolute(0x6D, 0x12, 4, {a: 0x23}, {a: 0x35});
        util.testDereferencingAbsoluteX(0x7D, 0x12, 4, 5, {a: 0x23}, {a: 0x35});
        util.testDereferencingAbsoluteY(0x79, 0x12, 4, 5, {a: 0x23}, {a: 0x35});
        util.testDereferencingIndirectX(0x61, 0x12, 6, {a: 0x23}, {a: 0x35});
        util.testDereferencingIndirectY(0x71, 0x12, 5, 6, {a: 0x23}, {a: 0x35});
    });

    suite('SBC', function() {
        testSbc(0xE9, 0x45, 0x01, 0x44, CpuInterface.Flags.c, 0);
        testSbc(0xE9, 0x45, 0x36, 0x0F, CpuInterface.Flags.c, 0);
        testSbc(0xE9, 0x45, 0x36, 0x0F, CpuInterface.Flags.c, 0);
        testSbc(0xE9, 0x45, 0x50, 0xF5, CpuInterface.Flags.n, 0);
        testSbc(0xE9, 0xFF, 0xFE, 0x00, CpuInterface.Flags.z | CpuInterface.Flags.c, 0, true);
        testSbcBcd(0xE9, 0x34, 0x12, 0x22, CpuInterface.Flags.c, 0);
        testSbcBcd(0xE9, 0x34, 0x17, 0x17, CpuInterface.Flags.c, 0);
        testSbcBcd(0xE9, 0x78, 0x80, 0x98, 0, CpuInterface.Flags.n);
        testSbcBcd(0xE9, 0x56, 0x56, 0x00, CpuInterface.Flags.c | CpuInterface.Flags.z, 0);
        testSbcBcd(0xE9, 0x56, 0x56, 0x99, CpuInterface.Flags.n, 0, true);

        util.testDereferencingZeropage(0xE5, 0xFF, 3, {a: 0x10}, {a: 0x10});
        util.testDereferencingZeropageX(0xF5, 0xFF, 4, {a: 0x10}, {a: 0x10});
        util.testDereferencingAbsolute(0xED, 0xFF, 4, {a: 0x10}, {a: 0x10});
        util.testDereferencingAbsoluteX(0xFD, 0xFF, 4, 5, {a: 0x10}, {a: 0x10});
        util.testDereferencingAbsoluteY(0xF9, 0xFF, 4, 5, {a: 0x10}, {a: 0x10});
        util.testDereferencingIndirectX(0xE1, 0xFF, 6, {a: 0x10}, {a: 0x10});
        util.testDereferencingIndirectY(0xF1, 0xFF, 5, 6, {a: 0x10}, {a: 0x10});
    });

    suite('UNDOC-SBC', function() {
        testSbc(0xEB, 0x45, 0x01, 0x44, CpuInterface.Flags.c, 0);
        testSbc(0xEB, 0x45, 0x36, 0x0F, CpuInterface.Flags.c, 0);
        testSbc(0xEB, 0x45, 0x36, 0x0F, CpuInterface.Flags.c, 0);
        testSbc(0xEB, 0x45, 0x50, 0xF5, CpuInterface.Flags.n, 0);
        testSbc(0xEB, 0xFF, 0xFE, 0x00, CpuInterface.Flags.z | CpuInterface.Flags.c, 0, true);
        testSbcBcd(0xEB, 0x34, 0x12, 0x22, CpuInterface.Flags.c, 0);
        testSbcBcd(0xEB, 0x34, 0x17, 0x17, CpuInterface.Flags.c, 0);
        testSbcBcd(0xEB, 0x78, 0x80, 0x98, 0, CpuInterface.Flags.n);
        testSbcBcd(0xEB, 0x56, 0x56, 0x00, CpuInterface.Flags.c | CpuInterface.Flags.z, 0);
        testSbcBcd(0xEB, 0x56, 0x56, 0x99, CpuInterface.Flags.n, 0, true);
    });
}
