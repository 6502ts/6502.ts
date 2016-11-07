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

    suite('NOP', function() {
        util.testImplied(0x1A, 2, {}, {});
        util.testImplied(0x3A, 2, {}, {});
        util.testImplied(0x5A, 2, {}, {});
        util.testImplied(0x7A, 2, {}, {});
        util.testImplied(0xDA, 2, {}, {});
        util.testImplied(0xFA, 2, {}, {});
    });

    suite('DOP', function() {
        util.testImmediate(0x80, 0x00, 2, {}, {});
        util.testImmediate(0x82, 0x00, 2, {}, {});
        util.testImmediate(0x89, 0x00, 2, {}, {});
        util.testImmediate(0xC2, 0x00, 2, {}, {});
        util.testImmediate(0xE2, 0x00, 2, {}, {});

        util.testDereferencingZeropage(0x04, 0x00, 3, {}, {});
        util.testDereferencingZeropage(0x44, 0x00, 3, {}, {});
        util.testDereferencingZeropage(0x64, 0x00, 3, {}, {});

        util.testDereferencingZeropageX(0x14, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0x34, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0x54, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0x74, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0xD4, 0x00, 4, {}, {});
        util.testDereferencingZeropageX(0xF4, 0x00, 4, {}, {});
    });

    suite('TOP', function() {
        util.testDereferencingAbsolute(0x0C, 0x00, 4, {}, {});
        util.testDereferencingAbsoluteX(0x1C, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0x3C, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0x5C, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0x7C, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0xDC, 0x00, 4, 5, {}, {});
        util.testDereferencingAbsoluteX(0xFC, 0x00, 4, 5, {}, {});
    });

    suite('LAX', function() {
        util.testDereferencingZeropage(0xA7, 0xFF, 3,
            {
                flags: 0xFF & ~CpuInterface.Flags.n
            },
            {
                a: 0xFF,
                x: 0xFF,
                flags: 0xFF & ~CpuInterface.Flags.z
            },
            '0xFF, flags'
        );

        const operand = 0xBF,
            stateBefore = {
                flags: 0xFF & ~CpuInterface.Flags.n
            },
            stateAfter = {
                a: 0xBF,
                x: 0xBF,
                flags: 0xFF & ~CpuInterface.Flags.z
            },
            extra = ', 0xBF, flags';

        util.testDereferencingZeropageY(0xB7, operand, 4, stateBefore, stateAfter, extra);

        util.testDereferencingAbsolute(0xAF, operand, 4, stateBefore, stateAfter, extra);

        util.testDereferencingAbsoluteY(0xBF, operand, 4, 5, stateBefore, stateAfter, extra);

        util.testDereferencingIndirectX(0xA3, operand, 6, stateBefore, stateAfter, extra);

        util.testDereferencingIndirectY(0xB3, operand, 5, 6, stateBefore, stateAfter, extra);
    });

    suite('ALR', function() {
        test('immediate, 0xF0, flags', () => Runner
                .create([0x4B, 0xFF])
                .setState({
                    a: 0xF0,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0x78,
                    flags: 0xFF & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z & ~CpuInterface.Flags.c
                })
        );

        test('immediate, 0x5F, flags', () => Runner
                .create([0x4B, 0x77])
                .setState({
                    a: 0x5F,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0x2B,
                    flags: 0xFF & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
                })
        );
    });

    suite('DCP', function() {
        util.testMutatingZeropage(0xC7, 0xFF, 0xFE, 5,
            {
                a: 0xFE,
                flags: 0xFF & ~CpuInterface.Flags.n & ~CpuInterface.Flags.c
            }, {
                flags: 0xFF & ~CpuInterface.Flags.n
            },
            ', OxFE, flags'
        );

        const operand = 0xFF,
            result = 0xFE,
            stateBefore = {
                a: 0xFF,
                flags: 0xFF & ~CpuInterface.Flags.n & ~CpuInterface.Flags.c
            },
            stateAfter = {
                flags: 0xFF & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
            },
            extra = ', OxFF, flags';

        util.testMutatingZeropage(0xC7, operand, result, 5, stateBefore, stateAfter, extra);

        util.testMutatingZeropageX(0xD7, operand, result, 6, stateBefore, stateAfter, extra);

        util.testMutatingAbsolute(0xCF, operand, result, 6, stateBefore, stateAfter, extra);

        util.testMutatingAbsoluteX(0xDF, operand, result, 7, 7, stateBefore, stateAfter, extra);

        util.testMutatingAbsoluteY(0xDB, operand, result, 7, 7, stateBefore, stateAfter, extra);

        util.testMutatingIndirectX(0xC3, operand, result, 8, stateBefore, stateAfter, extra);

        util.testMutatingIndirectY(0xD3, operand, result, 8, 8, stateBefore, stateAfter, extra);
    });

    suite('AXS', function() {
        test('immediate, 0xF0, flags', () => Runner
            .create([0xCB, 0x02])
            .setState({
                a: 0xF0,
                x: 0xBF,
                flags: 0xFF & ~CpuInterface.Flags.n
            })
            .run()
            .assertCycles(2)
            .assertState({
                x: 0xAE,
                flags: 0xFF & ~CpuInterface.Flags.z
            })
        );
    });

}