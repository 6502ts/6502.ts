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

export function run() {

        suite('software interrupts', function() {

            test('BRK - RTI cycle', () => Runner
                .create([0x00], 0xE000)
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xFF
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34,
                    '0x3412': 0x40 // RTI
                })
                .runFor(13)
                .assertState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    p: 0xE002,
                    s: 0xFF
                })
                .assertMemory({
                    '0x01FD': CpuInterface.Flags.z | CpuInterface.Flags.b | CpuInterface.Flags.e
                })
            );

        });

}