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
import * as util from './util';

export function run() {
    suite('ARR', function() {
        util.testImmediate(
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
        util.testImplied(0x1a, 2, {}, {});
        util.testImplied(0x3a, 2, {}, {});
        util.testImplied(0x5a, 2, {}, {});
        util.testImplied(0x7a, 2, {}, {});
        util.testImplied(0xda, 2, {}, {});
        util.testImplied(0xfa, 2, {}, {});
    });

    suite('DOP', function() {
        util.testImmediate(0x80, 0x00, 2, {}, {});
        util.testImmediate(0x82, 0x00, 2, {}, {});
        util.testImmediate(0x89, 0x00, 2, {}, {});
        util.testImmediate(0xc2, 0x00, 2, {}, {});
        util.testImmediate(0xe2, 0x00, 2, {}, {});

        util.testDereferencingZeropage(0x04, 0x00, 3, {}, {});
        util.testDereferencingZeropage(0x44, 0x00, 3, {}, {});
        util.testDereferencingZeropage(0x64, 0x00, 3, {}, {});

        util.testDereferencingZeropageX(0x14, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0x34, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0x54, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0x74, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0xd4, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0xf4, 0x00, 4, {}, {});
    });

    suite('TOP', function() {
        util.testDereferencingAbsolute(0x0c, 0x00, 4, {}, {});
        util.testDereferencingAbsoluteX(0x1c, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0x3c, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0x5c, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0x7c, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0xdc, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0xfc, 0x00, 4, 5, {}, {});
    });

    suite('LAX', function() {
        util.testDereferencingZeropage(
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

        util.testDereferencingZeropageY(0xb7, operand, 4, stateBefore, stateAfter, extra);

        util.testDereferencingAbsolute(0xaf, operand, 4, stateBefore, stateAfter, extra);

        util.testDereferencingAbsoluteY(0xbf, operand, 4, 5, stateBefore, stateAfter, extra);

        util.testDereferencingIndirectX(0xa3, operand, 6, stateBefore, stateAfter, extra);

        util.testDereferencingIndirectY(0xb3, operand, 5, 6, stateBefore, stateAfter, extra);
    });

    suite('ALR', function() {
        test('immediate, 0xF0, flags', () =>
            Runner.create([0x4b, 0xff])
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
            Runner.create([0x4b, 0x77])
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

        util.testMutatingZeropage(0xc7, operand, result, 5, stateBefore, stateAfter, extra);

        util.testMutatingZeropageX(0xd7, operand, result, 6, stateBefore, stateAfter, extra);

        util.testMutatingAbsolute(0xcf, operand, result, 6, stateBefore, stateAfter, extra);

        util.testMutatingAbsoluteX(0xdf, operand, result, 7, 7, stateBefore, stateAfter, extra);

        util.testMutatingAbsoluteY(0xdb, operand, result, 7, 7, stateBefore, stateAfter, extra);

        util.testMutatingIndirectX(0xc3, operand, result, 8, stateBefore, stateAfter, extra);

        util.testMutatingIndirectY(0xd3, operand, result, 8, 8, stateBefore, stateAfter, extra);
    });

    suite('AXS', function() {
        test('immediate, 0xF0, flags', () =>
            Runner.create([0xcb, 0x02])
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
            Runner.create([0xab, 0x0f])
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
}
