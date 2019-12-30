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

    suite('SLO', function() {
        util.testMutatingZeropage(
            cpuFactory,
            0x07,
            0xff,
            0xfe,
            5,
            { a: 0x01, flags: CpuInterface.Flags.e },
            { a: 0xff, flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.n },
            'mem = 0xff, a = 0x01'
        );

        const operand = 0x44,
            result = 0x88,
            stateBefore = { a: 0x04, flags: CpuInterface.Flags.e },
            stateAfter = { a: 0x8c, flags: CpuInterface.Flags.e | CpuInterface.Flags.n },
            extra = 'mem = 0x44, a = 0x04';

        util.testMutatingZeropage(cpuFactory, 0x07, operand, result, 5, stateBefore, stateAfter, extra);
        util.testMutatingZeropageX(cpuFactory, 0x17, operand, result, 6, stateBefore, stateAfter, extra);
        util.testMutatingAbsolute(cpuFactory, 0x0f, operand, result, 6, stateBefore, stateAfter, extra);
        util.testMutatingAbsoluteX(cpuFactory, 0x1f, operand, result, 7, 7, stateBefore, stateAfter, extra);
        util.testMutatingAbsoluteY(cpuFactory, 0x1b, operand, result, 7, 7, stateBefore, stateAfter, extra);
        util.testMutatingIndirectX(cpuFactory, 0x03, operand, result, 8, stateBefore, stateAfter, extra);
        util.testMutatingIndirectY(cpuFactory, 0x13, operand, result, 8, 8, stateBefore, stateAfter, extra);
    });

    suite('AAX', function() {
        util.testMutatingZeropage(
            cpuFactory,
            0x87,
            0xff,
            0x92,
            3,
            { a: 0xba, x: 0xd3, flags: CpuInterface.Flags.e },
            { flags: CpuInterface.Flags.e | CpuInterface.Flags.n },
            'a = 0xca, x = 0x53'
        );

        const operand = 0x00,
            result = 0x42,
            stateBefore = { a: 0x52, x: 0x43, flags: CpuInterface.Flags.e },
            stateAfter = {},
            extra = 'a = 0x52, x = 0x43';

        util.testMutatingZeropage(cpuFactory, 0x87, operand, result, 3, stateBefore, stateAfter, extra);
        util.testMutatingZeropageY(cpuFactory, 0x97, operand, result, 4, stateBefore, stateAfter, extra);
        util.testMutatingAbsolute(cpuFactory, 0x8f, operand, result, 4, stateBefore, stateAfter, extra);

        test(`indirect,X ${extra}`, () =>
            Runner.create(cpuFactory, [0x83, 0x34])
                .setState(stateBefore)
                .poke({
                    '0x0077': 0x87,
                    '0x0078': 0x6e,
                    '0x6E87': operand
                })
                .run()
                .assertCycles(6)
                .assertState(stateAfter)
                .assertMemory({
                    '0x6E87': result
                }));
    });

    suite('LAR', () => {
        util.testDereferencingAbsoluteY(
            cpuFactory,
            0xbb,
            0x00,
            4,
            5,
            { s: 0xff, a: 0x12, x: 0x34, flags: CpuInterface.Flags.e },
            { s: 0x00, a: 0x00, x: 0x00, flags: CpuInterface.Flags.e | CpuInterface.Flags.z },
            'memory = 0x00, s = 0xff'
        );

        util.testDereferencingAbsoluteY(
            cpuFactory,
            0xbb,
            0x93,
            4,
            5,
            { s: 0xa5, a: 0x12, x: 0x34, flags: CpuInterface.Flags.e },
            { s: 0x81, a: 0x81, x: 0x81, flags: CpuInterface.Flags.e | CpuInterface.Flags.n },
            'memory = 0x93, s = 0xa5'
        );
    });

    suite('ISC', () => {
        util.testMutatingZeropage(
            cpuFactory,
            0xe7,
            0xa0,
            0xa1,
            5,
            { a: 0xa6, flags: CpuInterface.Flags.e | CpuInterface.Flags.c },
            { a: 0x05, flags: CpuInterface.Flags.e | CpuInterface.Flags.c },
            'mem = 0xa0, a = 0xa6, no borrow'
        );

        const operand = 0xfc,
            result = 0xfd,
            stateBefore = { a: 0xff, flags: CpuInterface.Flags.e },
            stateAfter = { a: 0x01, flags: CpuInterface.Flags.e | CpuInterface.Flags.c },
            extra = 'mem = 0xfe, a = 0x01, borrow';

        util.testMutatingZeropage(cpuFactory, 0xe7, operand, result, 5, stateBefore, stateAfter, extra);
        util.testMutatingZeropageX(cpuFactory, 0xf7, operand, result, 6, stateBefore, stateAfter, extra);
        util.testMutatingAbsolute(cpuFactory, 0xef, operand, result, 6, stateBefore, stateAfter, extra);
        util.testMutatingAbsoluteX(cpuFactory, 0xff, operand, result, 7, 7, stateBefore, stateAfter, extra);
        util.testMutatingAbsoluteY(cpuFactory, 0xfb, operand, result, 7, 7, stateBefore, stateAfter, extra);
        util.testMutatingIndirectX(cpuFactory, 0xe3, operand, result, 8, stateBefore, stateAfter, extra);
        util.testMutatingIndirectY(cpuFactory, 0xf3, operand, result, 8, 8, stateBefore, stateAfter, extra);
    });

    suite('AAC', () => {
        util.testImmediate(cpuFactory, 0x0b, 0x97, 2, { a: 0x11, flags: CpuInterface.Flags.e }, {}, '0x0b, no carry');
        util.testImmediate(cpuFactory, 0x2b, 0x97, 2, { a: 0x11, flags: CpuInterface.Flags.e }, {}, '0x2b, no carry');
        util.testImmediate(
            cpuFactory,
            0x0b,
            0x97,
            2,
            { a: 0x81, flags: CpuInterface.Flags.e },
            { flags: CpuInterface.Flags.e | CpuInterface.Flags.n | CpuInterface.Flags.c },
            '0x0b, carry'
        );
        util.testImmediate(
            cpuFactory,
            0x2b,
            0x97,
            2,
            { a: 0x81, flags: CpuInterface.Flags.e },
            { flags: CpuInterface.Flags.e | CpuInterface.Flags.n | CpuInterface.Flags.c },
            '0x2b, carry'
        );
    });
}
