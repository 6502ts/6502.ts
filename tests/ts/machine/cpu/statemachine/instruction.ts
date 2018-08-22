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

import Runner from './Runner';
import { UnaryOneCycle, Write, ReadModifyWrite } from '../../../../../src/machine/cpu/statemachine/instruction';

export default function run(): void {
    suite('instructions', () => {
        test('unary one cycle', () => {
            let calls = 0;

            Runner.build()
                .read(0x0010, 0x11)
                .run(s => ({ ...s, p: 0x0010 }), s => new UnaryOneCycle(s, () => calls++), undefined);

            assert.strictEqual(calls, 1);
        });

        test('write', () =>
            Runner.build()
                .write(0x0010, 0x66)
                .run(s => ({ ...s, p: 0 }), s => new Write(s, () => 0x66), 0x0010));

        test('read modify write', () =>
            Runner.build()
                .read(0x0010, 0x42)
                .write(0x0010, 0x42)
                .write(0x0010, 0x66)
                .run(s => ({ ...s, p: 0 }), s => new ReadModifyWrite(s, () => 0x66), 0x0010));
    });
}
