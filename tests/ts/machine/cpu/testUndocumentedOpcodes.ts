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

import Runner from './Runner';
import CpuInterface from '../../../../src/machine/cpu/CpuInterface';
import * as util from './util';

export function run(cpuFactory: Runner.CpuFactory) {
    suite('ARR', function() {
        util.testImmediate(
            cpuFactory,
            0x6b,
            0x40,
            2,
            {
                a: 0xc0,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                a: 0xa0,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n | CpuInterface.Flags.v
            }
        );
    });

    suite('NOP', function() {
        util.testImplied(cpuFactory, 0x1a, 2, {}, {});
        util.testImplied(cpuFactory, 0x3a, 2, {}, {});
        util.testImplied(cpuFactory, 0x5a, 2, {}, {});
        util.testImplied(cpuFactory, 0x7a, 2, {}, {});
        util.testImplied(cpuFactory, 0xda, 2, {}, {});
        util.testImplied(cpuFactory, 0xfa, 2, {}, {});
    });

    suite('DOP', function() {
        util.testImmediate(cpuFactory, 0x80, 0x00, 2, {}, {});
        util.testImmediate(cpuFactory, 0x82, 0x00, 2, {}, {});
        util.testImmediate(cpuFactory, 0x89, 0x00, 2, {}, {});
        util.testImmediate(cpuFactory, 0xc2, 0x00, 2, {}, {});
        util.testImmediate(cpuFactory, 0xe2, 0x00, 2, {}, {});

        util.testDereferencingZeropage(cpuFactory, 0x04, 0x00, 3, {}, {});
        util.testDereferencingZeropage(cpuFactory, 0x44, 0x00, 3, {}, {});
        util.testDereferencingZeropage(cpuFactory, 0x64, 0x00, 3, {}, {});

        util.testDereferencingZeropageX(cpuFactory, 0x14, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(cpuFactory, 0x34, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(cpuFactory, 0x54, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(cpuFactory, 0x74, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(cpuFactory, 0xd4, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(cpuFactory, 0xf4, 0x00, 4, {}, {});
    });

    suite('TOP', function() {
        util.testDereferencingAbsolute(cpuFactory, 0x0c, 0x00, 4, {}, {});
        util.testDereferencingAbsoluteX(cpuFactory, 0x1c, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(cpuFactory, 0x3c, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(cpuFactory, 0x5c, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(cpuFactory, 0x7c, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(cpuFactory, 0xdc, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(cpuFactory, 0xfc, 0x00, 4, 5, {}, {});
    });

    suite('LAX', function() {
        util.testDereferencingZeropage(
            cpuFactory,
            0xa7,
            0xff,
            3,
            {
                flags: 0xff & ~CpuInterface.Flags.n
            },
            {
                a: 0xff,
                x: 0xff,
                flags: 0xff & ~CpuInterface.Flags.z
            },
            '0xFF, flags'
        );

        const operand = 0xbf,
            stateBefore = {
                flags: 0xff & ~CpuInterface.Flags.n
            },
            stateAfter = {
                a: 0xbf,
                x: 0xbf,
                flags: 0xff & ~CpuInterface.Flags.z
            },
            extra = ', 0xBF, flags';

        util.testDereferencingZeropageY(cpuFactory, 0xb7, operand, 4, stateBefore, stateAfter, extra);

        util.testDereferencingAbsolute(cpuFactory, 0xaf, operand, 4, stateBefore, stateAfter, extra);

        util.testDereferencingAbsoluteY(cpuFactory, 0xbf, operand, 4, 5, stateBefore, stateAfter, extra);

        util.testDereferencingIndirectX(cpuFactory, 0xa3, operand, 6, stateBefore, stateAfter, extra);

        util.testDereferencingIndirectY(cpuFactory, 0xb3, operand, 5, 6, stateBefore, stateAfter, extra);
    });

    suite('ALR', function() {
        test('immediate, 0xF0, flags', () =>
            Runner.create(cpuFactory, [0x4b, 0xff])
                .setState({
                    a: 0xf0,
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0x78,
                    flags: 0xff & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z & ~CpuInterface.Flags.c
                }));

        test('immediate, 0x5F, flags', () =>
            Runner.create(cpuFactory, [0x4b, 0x77])
                .setState({
                    a: 0x5f,
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0x2b,
                    flags: 0xff & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
                }));
    });

    suite('DCP', function() {
        util.testMutatingZeropage(
            cpuFactory,
            0xc7,
            0xff,
            0xfe,
            5,
            {
                a: 0xfe,
                flags: 0xff & ~CpuInterface.Flags.n & ~CpuInterface.Flags.c
            },
            {
                flags: 0xff & ~CpuInterface.Flags.n
            },
            ', OxFE, flags'
        );

        const operand = 0xff,
            result = 0xfe,
            stateBefore = {
                a: 0xff,
                flags: 0xff & ~CpuInterface.Flags.n & ~CpuInterface.Flags.c
            },
            stateAfter = {
                flags: 0xff & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
            },
            extra = ', OxFF, flags';

        util.testMutatingZeropage(cpuFactory, 0xc7, operand, result, 5, stateBefore, stateAfter, extra);

        util.testMutatingZeropageX(cpuFactory, 0xd7, operand, result, 6, stateBefore, stateAfter, extra);

        util.testMutatingAbsolute(cpuFactory, 0xcf, operand, result, 6, stateBefore, stateAfter, extra);

        util.testMutatingAbsoluteX(cpuFactory, 0xdf, operand, result, 7, 7, stateBefore, stateAfter, extra);

        util.testMutatingAbsoluteY(cpuFactory, 0xdb, operand, result, 7, 7, stateBefore, stateAfter, extra);

        util.testMutatingIndirectX(cpuFactory, 0xc3, operand, result, 8, stateBefore, stateAfter, extra);

        util.testMutatingIndirectY(cpuFactory, 0xd3, operand, result, 8, 8, stateBefore, stateAfter, extra);
    });

    suite('AXS', function() {
        test('immediate, 0xF0, flags', () =>
            Runner.create(cpuFactory, [0xcb, 0x02])
                .setState({
                    a: 0xf0,
                    x: 0xbf,
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    x: 0xae,
                    flags: 0xff & ~CpuInterface.Flags.z
                }));
    });

    suite('ATX', function() {
        test('immedaiate, flags', () =>
            Runner.create(cpuFactory, [0xab, 0x0f])
                .setState({
                    a: 0xf7,
                    x: 0x11,
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    x: 0x07,
                    a: 0x07,
                    flags: 0xff & ~(CpuInterface.Flags.n | CpuInterface.Flags.z)
                }));
    });

    suite('RRA', function() {
        util.testMutatingZeropage(
            cpuFactory,
            0x67,
            0x7f,
            0x3f,
            5,
            { a: 0x01, flags: CpuInterface.Flags.e },
            { a: 0x41 },
            'mem = 0x7f, a = 0x01, no carry'
        );

        const operand = 0x7f,
            result = 0xbf,
            stateBefore = { a: 0x01, flags: CpuInterface.Flags.e | CpuInterface.Flags.c },
            stateAfter = { a: 0xc1, flags: CpuInterface.Flags.e | CpuInterface.Flags.n },
            extra = 'mem = 0x7f, a = 0x01, carry';

        util.testMutatingZeropage(cpuFactory, 0x67, operand, result, 5, stateBefore, stateAfter, extra);
        util.testMutatingZeropageX(cpuFactory, 0x77, operand, result, 6, stateBefore, stateAfter, extra);
        util.testMutatingAbsolute(cpuFactory, 0x6f, operand, result, 6, stateBefore, stateAfter, extra);
        util.testMutatingAbsoluteX(cpuFactory, 0x7f, operand, result, 7, 7, stateBefore, stateAfter, extra);
        util.testMutatingAbsoluteY(cpuFactory, 0x7b, operand, result, 7, 7, stateBefore, stateAfter, extra);
        util.testMutatingIndirectX(cpuFactory, 0x63, operand, result, 8, stateBefore, stateAfter, extra);
        util.testMutatingIndirectY(cpuFactory, 0x73, operand, result, 8, 8, stateBefore, stateAfter, extra);
    });

    suite('RLA', function() {
        util.testMutatingZeropage(
            cpuFactory,
            0x27,
            0x7f,
            0xfe,
            5,
            { a: 0x0f, flags: CpuInterface.Flags.e },
            { a: 0x0e },
            'mem = 0x7f, a = 0x01, no carry'
        );

        const operand = 0x7f,
            result = 0xff,
            stateBefore = { a: 0x0f, flags: CpuInterface.Flags.e | CpuInterface.Flags.c },
            stateAfter = { a: 0x0f, flags: CpuInterface.Flags.e },
            extra = 'mem = 0x7f, a = 0x01, carry';

        util.testMutatingZeropage(cpuFactory, 0x27, operand, result, 5, stateBefore, stateAfter, extra);
        util.testMutatingZeropageX(cpuFactory, 0x37, operand, result, 6, stateBefore, stateAfter, extra);
        util.testMutatingAbsolute(cpuFactory, 0x2f, operand, result, 6, stateBefore, stateAfter, extra);
        util.testMutatingAbsoluteX(cpuFactory, 0x3f, operand, result, 7, 7, stateBefore, stateAfter, extra);
        util.testMutatingAbsoluteY(cpuFactory, 0x3b, operand, result, 7, 7, stateBefore, stateAfter, extra);
        util.testMutatingIndirectX(cpuFactory, 0x23, operand, result, 8, stateBefore, stateAfter, extra);
        util.testMutatingIndirectY(cpuFactory, 0x33, operand, result, 8, 8, stateBefore, stateAfter, extra);
    });
}
