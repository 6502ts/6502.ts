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

import assert from 'assert';

import { default as Runner, incrementP, decrementS, incrementS } from './Runner';
import {
    branch,
    nullaryOneCycle,
    write,
    readModifyWrite,
    jsr,
    rts
} from '../../../../../src/machine/cpu/statemachine/instruction';

export default function run(): void {
    suite('instructions', () => {
        test('unary one cycle', () => {
            let calls = 0;

            Runner.build()
                .read(0x0010, 0x11)
                .pollInterrupts()
                .run(s => ({ ...s, p: 0x0010 }), s => nullaryOneCycle(s, () => calls++), undefined);

            assert.strictEqual(calls, 1);
        });

        test('write', () =>
            Runner.build()
                .write(0x0010, 0x66)
                .run(s => ({ ...s, p: 0 }), s => write(s, () => 0x66), 0x0010));

        test('read modify write', () =>
            Runner.build()
                .read(0x0010, 0x42)
                .write(0x0010, 0x42)
                .write(0x0010, 0x66)
                .run(s => ({ ...s, p: 0 }), s => readModifyWrite(s, () => 0x66), 0x0010));

        suite('branch', () => {
            test('no branch', () =>
                Runner.build()
                    .read(0x0010, 0x42)
                    .pollInterrupts()
                    .action(incrementP)
                    .run(s => ({ ...s, p: 0x0010 }), s => branch(s, () => false), undefined));

            test('branch, no page crossing', () =>
                Runner.build()
                    .read(0x0010, 0x13)
                    .pollInterrupts()
                    .action(incrementP)
                    .read(0x0011, 0x66)
                    .action(s => ({ ...s, p: 0x0024 }))
                    .run(s => ({ ...s, p: 0x0010 }), s => branch(s, () => true), undefined));

            test('branch, page overflow', () =>
                Runner.build()
                    .read(0x01ef, 0x13)
                    .pollInterrupts()
                    .action(incrementP)
                    .read(0x01f0, 0x66)
                    .read(0x0103, 0x42)
                    .pollInterrupts()
                    .action(s => ({ ...s, p: 0x0203 }))
                    .run(s => ({ ...s, p: 0x01ef }), s => branch(s, () => true), undefined));

            test('branch, page underflow', () =>
                Runner.build()
                    .read(0x0100, 0xfe)
                    .pollInterrupts()
                    .action(incrementP)
                    .read(0x0101, 0x66)
                    .read(0x01ff, 0x42)
                    .pollInterrupts()
                    .action(s => ({ ...s, p: 0x00ff }))
                    .run(s => ({ ...s, p: 0x0100 }), s => branch(s, () => true), undefined));
        });

        test('jsr', () =>
            Runner.build()
                .read(0x3310, 0x34)
                .action(incrementP)
                .read(0x0130, 0x66)
                .write(0x0130, 0x33)
                .action(decrementS)
                .write(0x012f, 0x011)
                .action(decrementS)
                .read(0x3311, 0x12)
                .action(s => ({ ...s, p: 0x1234 }))
                .run(s => ({ ...s, p: 0x3310, s: 0x30 }), s => jsr(s), undefined));

        test('rts', () =>
            Runner.build()
                .read(0x1110, 0x66)
                .read(0x0130, 0x22)
                .action(incrementS)
                .read(0x0131, 0x34)
                .action(s => ({ ...s, p: 0x1134, s: 0x32 }))
                .read(0x0132, 0x12)
                .action(s => ({ ...s, p: 0x1234 }))
                .read(0x01234, 0x66)
                .action(incrementP)
                .run(s => ({ ...s, p: 0x1110, s: 0x30 }), s => rts(s), undefined));
    });
}
