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

export function run(cpuFactory: Runner.CpuFactory) {
    suite('software interrupts', function() {
        test('BRK - RTI cycle', () =>
            Runner.create(cpuFactory, [0x00], 0xe000)
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .run(2)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    p: 0xe002,
                    s: 0xff
                })
                .assertMemory({
                    '0x01FD': CpuInterface.Flags.z | CpuInterface.Flags.b | CpuInterface.Flags.e
                }));
    });

    suite('IRQ', function() {
        test('INT - RTI cycle', () =>
            Runner.create(cpuFactory, [0xea, 0xea, 0xea], 0xe000) // NOP NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.setInterrupt(true))
                .runFor(8)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfc,
                    p: 0x3412
                })
                .assertMemory({
                    '0x01FD': CpuInterface.Flags.z | CpuInterface.Flags.e
                })
                .configure(cpu => cpu.setInterrupt(false))
                .runFor(6)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff,
                    p: 0xe001
                })
                .run(2)
                .assertCycles(4));

        test('INT - RTI cycle, stack wrap', () =>
            Runner.create(cpuFactory, [0xea, 0xea, 0xea], 0xe000) // NOP NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0x01
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.setInterrupt(true))
                .runFor(8)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfe,
                    p: 0x3412
                })
                .assertMemory({
                    '0x01FF': CpuInterface.Flags.z | CpuInterface.Flags.e
                })
                .configure(cpu => cpu.setInterrupt(false))
                .runFor(6)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0x01,
                    p: 0xe001
                })
                .run(2)
                .assertCycles(4));

        test('CLI', () =>
            Runner.create(cpuFactory, [0xea, 0xea, 0xea], 0xe000) // NOP NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xff
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.setInterrupt(true))
                .run(3)
                .assertCycles(5));

        test('Interrupt during RTI', () =>
            Runner.create(cpuFactory, [0xea, 0xea, 0xea], 0xe000) // NOP NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0x01
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.setInterrupt(true))
                .runFor(8)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfe,
                    p: 0x3412
                })
                .assertMemory({
                    '0x01FF': CpuInterface.Flags.z | CpuInterface.Flags.e
                })
                .configure(cpu => cpu.setInterrupt(false))
                .runFor(3)
                .configure(cpu => cpu.setInterrupt(true))
                .runFor(3)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0x01,
                    p: 0xe001
                })
                .runFor(7)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfe,
                    p: 0x3412
                })
                .configure(cpu => cpu.setInterrupt(false))
                .run(3)
                .assertCycles(10));

        test('Interrupt during CLI', () =>
            Runner.create(cpuFactory, [0x58, 0xea, 0xea], 0xe000) // CLI NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xff
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .configure(cpu => cpu.setInterrupt(true))
                .runFor(3)
                .assertState({
                    p: 0xe002,
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e
                })
                .runFor(2)
                .configure(cpu => cpu.setInterrupt(false))
                .run(3)
                .assertCycles(14));

        test('Interrupt during SEI', () =>
            Runner.create(cpuFactory, [0x78, 0xea, 0xea]) // SEI NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.setInterrupt(true))
                .runFor(8)
                .assertState({
                    p: 0x3412,
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfc
                })
                .run(3)
                .assertCycles(10));

        test('Interrupt during PLP: clear flag', () =>
            Runner.create(cpuFactory, [0x28, 0xea, 0xea], 0xe000) // PLP NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfe
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x01FF': CpuInterface.Flags.z,
                    '0x3412': 0x40 // RTI
                })
                .configure(cpu => cpu.setInterrupt(true))
                .runFor(5)
                .assertState({
                    p: 0xe002,
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff
                })
                .runFor(2)
                .configure(cpu => cpu.setInterrupt(false))
                .run(3)
                .assertCycles(14));

        test('Interrupt during PLP: set flag', () =>
            Runner.create(cpuFactory, [0x28, 0xea, 0xea]) // PLP NOP NodeFilesystemProvider
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xfe
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x01FF': CpuInterface.Flags.z | CpuInterface.Flags.i,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.setInterrupt(true))
                .runFor(10)
                .assertState({
                    p: 0x3412,
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfc
                })
                .run(3)
                .assertCycles(10));
    });

    suite('NMI', function() {
        test('NMI - RTI cycle', () =>
            Runner.create(cpuFactory, [0xea, 0xea, 0xea], 0xe000) // NOP NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff
                })
                .poke({
                    '0xFFFA': 0x12,
                    '0xFFFB': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.nmi())
                .runFor(8)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfc,
                    p: 0x3412
                })
                .assertMemory({
                    '0x01FD': CpuInterface.Flags.z | CpuInterface.Flags.e
                })
                .runFor(6)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff,
                    p: 0xe001
                })
                .run(2)
                .assertCycles(4));

        test('NMI - RTI cycle, stack wrap', () =>
            Runner.create(cpuFactory, [0xea, 0xea, 0xea], 0xe000) // NOP NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0x01
                })
                .poke({
                    '0xFFFA': 0x12,
                    '0xFFFB': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.nmi())
                .runFor(8)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfe,
                    p: 0x3412
                })
                .assertMemory({
                    '0x01FF': CpuInterface.Flags.z | CpuInterface.Flags.e
                })
                .runFor(6)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0x01,
                    p: 0xe001
                })
                .run(2)
                .assertCycles(4));

        test('CLI', () =>
            Runner.create(cpuFactory, [0xea, 0xea, 0xea], 0xe000) // NOP NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0x01
                })
                .poke({
                    '0xFFFA': 0x12,
                    '0xFFFB': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.nmi())
                .run(5)
                .assertState({})
                .assertCycles(18));

        test('Hijack BRK', () =>
            Runner.create(cpuFactory, [0x00, 0xea, 0xea, 0xea], 0xe000) // BRK NOP NOP
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff
                })
                .poke({
                    '0xFFFA': 0x12,
                    '0xFFFB': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(2)
                .configure(cpu => cpu.nmi())
                .runFor(5)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    s: 0xfc,
                    p: 0x3412
                })
                .assertMemory({
                    '0x01FD': CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.b
                })
                .run(3)
                .assertCycles(10));

        test('Hijack IRQ', () =>
            Runner.create(cpuFactory, [0xea, 0xea, 0xea], 0xe000)
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff
                })
                .poke({
                    '0xFFFA': 0x12,
                    '0xFFFB': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(1)
                .configure(cpu => cpu.setInterrupt(true))
                .runFor(2)
                .configure(cpu => cpu.nmi())
                .runFor(6)
                .assertState({
                    s: 0xfc,
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.i,
                    p: 0x3412
                })
                .assertMemory({
                    '0x01FD': CpuInterface.Flags.z | CpuInterface.Flags.e
                })
                .configure(cpu => cpu.setInterrupt(false))
                .run(3)
                .assertCycles(10));
    });
}
