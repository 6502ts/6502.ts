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

import { default as Runner, incrementP } from './Runner';
import { Immediate, ZeroPage, Absolute } from '../../../../../src/machine/cpu/statemachine/addressing';

export default function run() {
    suite('address modes', () => {
        test('immediate', () =>
            Runner.build()
                .read(0x0010, 0x43)
                .result(incrementP)
                .run<Immediate, undefined>(
                    s => ({ ...s, p: 0x0010 }),
                    (state, bus) => new Immediate(state, bus),
                    undefined
                )
                .assert(s => assert.strictEqual(s.operand, 0x43)));

        suite('zeropage', () => {
            test('no dereference', () =>
                Runner.build()
                    .read(0x0010, 0x43)
                    .result(incrementP)
                    .run<ZeroPage, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new ZeroPage(state, bus, false),
                        undefined
                    )
                    .assert(s => assert.strictEqual(s.operand, 0x43)));

            test('dereference', () =>
                Runner.build()
                    .read(0x0010, 0x43)
                    .result(incrementP)
                    .read(0x43, 0x66)
                    .run<ZeroPage, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new ZeroPage(state, bus),
                        undefined
                    )
                    .assert(s => assert.strictEqual(s.operand, 0x66)));
        });

        suite('absolute', () => {
            test('no dereference', () =>
                Runner.build()
                    .read(0x0010, 0x34)
                    .result(incrementP)
                    .read(0x0011, 0x12)
                    .result(incrementP)
                    .run<Absolute, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new Absolute(state, bus, false),
                        undefined
                    )
                    .assert(s => assert.strictEqual(s.operand, 0x1234)));

            test('dereference', () =>
                Runner.build()
                    .read(0x0010, 0x34)
                    .result(incrementP)
                    .read(0x0011, 0x12)
                    .result(incrementP)
                    .read(0x1234, 0x43)
                    .run<Absolute, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new Absolute(state, bus),
                        undefined
                    )
                    .assert(s => assert.strictEqual(s.operand, 0x43)));
        });
    });
}
