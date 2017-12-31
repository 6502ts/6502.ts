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

function branchSuite(mnemonic: string, opcode: number, jumpCondition: number, noJumpCondition: number): void {
    suite(mnemonic, function() {
        test('immediate, no branch', () =>
            Runner.create([opcode, 0x0f], 0xe000)
                .setState({
                    flags: noJumpCondition
                })
                .run()
                .assertCycles(2)
                .assertState({
                    p: 0xe000 + 2
                }));

        test('immediate, forward branch', () =>
            Runner.create([opcode, 0x0f], 0xe000)
                .setState({
                    flags: jumpCondition
                })
                .run()
                .assertCycles(3)
                .assertState({
                    p: 0xe000 + 2 + 0x0f
                }));

        test('immediate, backward branch, page crossing', () =>
            Runner.create([opcode, (~0x0a & 0xff) + 1], 0xe000)
                .setState({
                    flags: jumpCondition
                })
                .run()
                .assertCycles(4)
                .assertState({
                    p: 0xe000 + 2 - 0x0a
                }));

        test('immediate, backward branch, page crossing @ 0xFE', () =>
            Runner.create([opcode, (~0x0a & 0xff) + 1], 0xe0fe)
                .setState({
                    flags: jumpCondition
                })
                .run()
                .assertCycles(4)
                .assertState({
                    p: 0xe0fe + 2 - 0x0a
                }));

        test('immediate, backward branch, page crossing @ 0xFF', () =>
            Runner.create([opcode, (~0x0a & 0xff) + 1], 0xe0ff)
                .setState({
                    flags: jumpCondition
                })
                .run()
                .assertCycles(4)
                .assertState({
                    p: 0xe0ff + 2 - 0x0a
                }));
    });
}

export function run(): void {
    branchSuite('BCC', 0x90, 0, CpuInterface.Flags.c);

    branchSuite('BNE', 0xd0, 0, CpuInterface.Flags.z);

    branchSuite('BEQ', 0xf0, CpuInterface.Flags.z, 0);

    branchSuite('BPL', 0x10, 0, CpuInterface.Flags.n);

    branchSuite('BMI', 0x30, CpuInterface.Flags.n, 0);

    branchSuite('BVC', 0x50, 0, CpuInterface.Flags.v);

    branchSuite('BVS', 0x70, CpuInterface.Flags.v, 0);
}
