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

function clearFlagSuite(mnemonic: string, opcode: number, flag: number) {
    suite(mnemonic, function() {
        test('implied', () =>
            Runner.create([opcode])
                .setState({
                    flags: CpuInterface.Flags.e | flag
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: CpuInterface.Flags.e
                }));
    });
}

function setFlagSuite(mnemonic: string, opcode: number, flag: number) {
    suite(mnemonic, function() {
        test('implied', () =>
            Runner.create([opcode])
                .setState({
                    flags: CpuInterface.Flags.e
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: CpuInterface.Flags.e | flag
                }));
    });
}

export function run(): void {
    clearFlagSuite('CLC', 0x18, CpuInterface.Flags.c);

    clearFlagSuite('CLD', 0xd8, CpuInterface.Flags.d);

    clearFlagSuite('CLI', 0x58, CpuInterface.Flags.i);

    clearFlagSuite('CLV', 0xb8, CpuInterface.Flags.v);

    setFlagSuite('SEC', 0x38, CpuInterface.Flags.c);

    setFlagSuite('SED', 0xf8, CpuInterface.Flags.d);

    setFlagSuite('SEI', 0x78, CpuInterface.Flags.i);
}
