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

import { strictEqual } from 'assert';

import { default as Runner, incrementP } from './Runner';
import {
    dereference,
    immediate,
    zeroPage,
    absolute,
    absoluteX,
    absoluteY,
    zeroPageX,
    zeroPageY,
    indexedIndirectX,
    indirectIndexedY
} from '../../../../../src/machine/cpu/statemachine/addressing';
import { indirect } from '../../../../../src/machine/cpu/statemachine/addressing/indirect';

export default function run(): void {
    suite('addressing modes', () => {
        test('immediate', () =>
            Runner.build()
                .read(0x0010, 0x43)
                .action(incrementP)
                .run(s => ({ ...s, p: 0x0010 }), (state, getResult) => immediate(state, getResult), undefined)
                .assert(result => strictEqual(result, 0x43)));

        suite('zeropage', () => {
            test('no dereference', () =>
                Runner.build()
                    .read(0x0010, 0x43)
                    .action(incrementP)
                    .run(s => ({ ...s, p: 0x0010 }), (state, getResult) => zeroPage(state, getResult), undefined)
                    .assert(result => strictEqual(result, 0x43)));

            test('dereference', () =>
                Runner.build()
                    .read(0x0010, 0x43)
                    .action(incrementP)
                    .read(0x43, 0x66)
                    .run(
                        s => ({ ...s, p: 0x0010 }),
                        (state, getResult) => zeroPage(state, dereference(state, getResult).reset),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x66)));
        });

        suite('absolute', () => {
            test('no dereference', () =>
                Runner.build()
                    .read(0x0010, 0x34)
                    .action(incrementP)
                    .read(0x0011, 0x12)
                    .action(incrementP)
                    .run(s => ({ ...s, p: 0x0010 }), (state, getResult) => absolute(state, getResult), undefined)
                    .assert(result => strictEqual(result, 0x1234)));

            test('dereference', () =>
                Runner.build()
                    .read(0x0010, 0x34)
                    .action(incrementP)
                    .read(0x0011, 0x12)
                    .action(incrementP)
                    .read(0x1234, 0x43)
                    .run(
                        s => ({ ...s, p: 0x0010 }),
                        (state, getResult) => absolute(state, dereference(state, getResult).reset),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x43)));
        });

        suite('indirect', () => {
            test('no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x56)
                    .action(incrementP)
                    .read(0x0011, 0x34)
                    .action(incrementP)
                    .read(0x3456, 0x34)
                    .read(0x3457, 0x12)
                    .run(s => ({ ...s, p: 0x0010 }), (state, getResult) => indirect(state, getResult), undefined)
                    .assert(result => strictEqual(result, 0x1234)));

            test('page boundary', () =>
                Runner.build()
                    .read(0x0010, 0xff)
                    .action(incrementP)
                    .read(0x0011, 0x34)
                    .action(incrementP)
                    .read(0x34ff, 0x34)
                    .read(0x3400, 0x12)
                    .run(s => ({ ...s, p: 0x0010 }), (state, getResult) => indirect(state, getResult), undefined)
                    .assert(result => strictEqual(result, 0x1234)));
        });

        suite('absolute indexed', () => {
            test('no derereference, read, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x24)
                    .action(incrementP)
                    .read(0x0011, 0x12)
                    .action(incrementP)
                    .run(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, getResult) => absoluteX(state, getResult, false),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));

            test('no derereference, read, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x35)
                    .action(incrementP)
                    .read(0x0011, 0x11)
                    .action(incrementP)
                    .read(0x1134, 0x42)
                    .run(
                        s => ({ ...s, p: 0x0010, y: 0xff }),
                        (state, getResult) => absoluteY(state, getResult, false),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));

            test('derereference, read, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x24)
                    .action(incrementP)
                    .read(0x0011, 0x12)
                    .action(incrementP)
                    .read(0x1234, 0x66)
                    .run(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, getResult) => absoluteX(state, dereference(state, getResult).reset, false),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x66)));

            test('derereference, read, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x35)
                    .action(incrementP)
                    .read(0x0011, 0x11)
                    .action(incrementP)
                    .read(0x1134, 0x42)
                    .read(0x1234, 0x66)
                    .run(
                        s => ({ ...s, p: 0x0010, y: 0xff }),
                        (state, getResult) => absoluteY(state, dereference(state, getResult).reset, false),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x66)));

            test('no derereference, write, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x24)
                    .action(incrementP)
                    .read(0x0011, 0x12)
                    .action(incrementP)
                    .read(0x1234, 0x66)
                    .run(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, getResult) => absoluteX(state, getResult, true),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));

            test('no derereference, write, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x35)
                    .action(incrementP)
                    .read(0x0011, 0x11)
                    .action(incrementP)
                    .read(0x1134, 0x42)
                    .run(
                        s => ({ ...s, p: 0x0010, y: 0xff }),
                        (state, getResult) => absoluteY(state, getResult, true),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));
        });

        suite('zeropage indexed', () => {
            test('no dereference, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x60)
                    .action(incrementP)
                    .read(0x60, 0x12)
                    .run(
                        s => ({ ...s, p: 0x0010, x: 0x06 }),
                        (state, getResult) => zeroPageX(state, getResult),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x66)));

            test('dereference, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x60)
                    .action(incrementP)
                    .read(0x60, 0x66)
                    .read(0x66, 0x42)
                    .run(
                        s => ({ ...s, p: 0x0010, y: 0x06 }),
                        (state, getResult) => zeroPageY(state, dereference(state, getResult).reset),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x42)));

            test('no dereference, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x67)
                    .action(incrementP)
                    .read(0x67, 0x12)
                    .run(
                        s => ({ ...s, p: 0x0010, x: 0xff }),
                        (state, getResult) => zeroPageX(state, getResult),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x66)));

            test('dereference, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x67)
                    .action(incrementP)
                    .read(0x67, 0x12)
                    .read(0x66, 0x42)
                    .run(
                        s => ({ ...s, p: 0x0010, y: 0xff }),
                        (state, getResult) => zeroPageY(state, dereference(state, getResult).reset),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x42)));
        });

        suite('indexed indirect', () => {
            test('no dereference, no page boundary', () =>
                Runner.build()
                    .read(0x10, 0x30)
                    .action(incrementP)
                    .read(0x30, 0x42)
                    .read(0x40, 0x34)
                    .read(0x41, 0x12)
                    .run(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, getResult) => indexedIndirectX(state, getResult),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));

            test('dereference, no page boundary', () =>
                Runner.build()
                    .read(0x10, 0x30)
                    .action(incrementP)
                    .read(0x30, 0x42)
                    .read(0x40, 0x34)
                    .read(0x41, 0x12)
                    .read(0x1234, 0x66)
                    .run(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, getResult) => indexedIndirectX(state, dereference(state, getResult).reset),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x66)));

            test('no dereference, page boundary', () =>
                Runner.build()
                    .read(0x10, 0x50)
                    .action(incrementP)
                    .read(0x50, 0x42)
                    .read(0x40, 0x34)
                    .read(0x41, 0x12)
                    .run(
                        s => ({ ...s, p: 0x0010, x: 0xf0 }),
                        (state, getResult) => indexedIndirectX(state, getResult),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));

            test('dereference, page boundary', () =>
                Runner.build()
                    .read(0x10, 0x50)
                    .action(incrementP)
                    .read(0x50, 0x42)
                    .read(0x40, 0x34)
                    .read(0x41, 0x12)
                    .read(0x1234, 0x66)
                    .run(
                        s => ({ ...s, p: 0x0010, x: 0xf0 }),
                        (state, getResult) => indexedIndirectX(state, dereference(state, getResult).reset),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x66)));
        });

        suite('indirect indexed Y', () => {
            test('no dereference, read, no page boundary', () =>
                Runner.build()
                    .read(0x10, 0x20)
                    .action(incrementP)
                    .read(0x20, 0x30)
                    .read(0x21, 0x12)
                    .run(
                        s => ({ ...s, p: 0x010, y: 0x04 }),
                        (state, getResult) => indirectIndexedY(state, getResult, false),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));

            test('dereference, read, no page boundary', () =>
                Runner.build()
                    .read(0x10, 0xff)
                    .action(incrementP)
                    .read(0xff, 0x30)
                    .read(0x00, 0x12)
                    .read(0x1234, 0x66)
                    .run(
                        s => ({ ...s, p: 0x010, y: 0x04 }),
                        (state, getResult) => indirectIndexedY(state, dereference(state, getResult).reset, false),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x66)));

            test('no dereference, read, page boundary', () =>
                Runner.build()
                    .read(0x10, 0x20)
                    .action(incrementP)
                    .read(0x20, 0x35)
                    .read(0x21, 0x11)
                    .read(0x1134, 0x66)
                    .run(
                        s => ({ ...s, p: 0x010, y: 0xff }),
                        (state, getResult) => indirectIndexedY(state, getResult, false),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));

            test('dereference, read, no page boundary', () =>
                Runner.build()
                    .read(0x10, 0xff)
                    .action(incrementP)
                    .read(0xff, 0x35)
                    .read(0x00, 0x11)
                    .read(0x1134, 0x66)
                    .read(0x1234, 0x66)
                    .run(
                        s => ({ ...s, p: 0x010, y: 0xff }),
                        (state, getResult) => indirectIndexedY(state, dereference(state, getResult).reset, false),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x66)));

            test('no dereference, write, no page boundary', () =>
                Runner.build()
                    .read(0x10, 0x20)
                    .action(incrementP)
                    .read(0x20, 0x30)
                    .read(0x21, 0x12)
                    .read(0x1234, 0x66)
                    .run(
                        s => ({ ...s, p: 0x010, y: 0x04 }),
                        (state, getResult) => indirectIndexedY(state, getResult, true),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));

            test('no dereference, write, page boundary', () =>
                Runner.build()
                    .read(0x10, 0x20)
                    .action(incrementP)
                    .read(0x20, 0x35)
                    .read(0x21, 0x11)
                    .read(0x1134, 0x66)
                    .run(
                        s => ({ ...s, p: 0x010, y: 0xff }),
                        (state, getResult) => indirectIndexedY(state, getResult, true),
                        undefined
                    )
                    .assert(result => strictEqual(result, 0x1234)));
        });
    });
}
