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

import * as assert from 'assert';

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
                    .action(incrementP)
                    .run(s => ({ ...s, p: 0x0010 }), s => branch(s, () => false), undefined));

            test('branch, no page crossing', () =>
                Runner.build()
                    .read(0x0010, 0x13)
                    .action(incrementP)
                    .read(0x0011, 0x66)
                    .action(s => ({ ...s, p: 0x0024 }))
                    .run(s => ({ ...s, p: 0x0010 }), s => branch(s, () => true), undefined));

            test('branch, page overflow', () =>
                Runner.build()
                    .read(0x01ef, 0x13)
                    .action(incrementP)
                    .read(0x01f0, 0x66)
                    .read(0x0103, 0x42)
                    .action(s => ({ ...s, p: 0x0203 }))
                    .run(s => ({ ...s, p: 0x01ef }), s => branch(s, () => true), undefined));

            test('branch, page underflow', () =>
                Runner.build()
                    .read(0x0100, 0xfe)
                    .action(incrementP)
                    .read(0x0101, 0x66)
                    .read(0x01ff, 0x42)
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
