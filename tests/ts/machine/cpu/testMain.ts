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

import { run as testBranches } from './testBranches';
import { run as testFlagToggles } from './testFlagToggles';
import { run as testArithmetics } from './testArithmetics';
import { run as testOtherOpcodes } from './testOtherOpcodes';
import { run as testAccessPatterns } from './testAccessPatterns';
import { run as testUndocumentedOpcodes } from './testUndocumentedOpcodes';

import BatchedAddressCp from '../../../../src/machine/cpu/BatchedAccessCpu';

import { run as testInterrupt } from './testInterrupt';
import Runner from './Runner';
import StateMachineCpu from '../../../../src/machine/cpu/StateMachineCpu';

function run(
    cpuFactory: Runner.CpuFactory,
    cpuName: string,
    {
        branches = true,
        flags = true,
        arithmetics = true,
        other = true,
        undocumented = true,
        access = true,
        interrupt = true
    } = {}
) {
    suite(`CPU [${cpuName}]`, function() {
        suite('opcodes', function() {
            if (branches) {
                testBranches(cpuFactory);
            }

            if (flags) {
                testFlagToggles(cpuFactory);
            }

            if (arithmetics) {
                testArithmetics(cpuFactory);
            }

            if (other) {
                testOtherOpcodes(cpuFactory);
            }
        });

        suite('undocumented opcodes', function() {
            if (undocumented) {
                testUndocumentedOpcodes(cpuFactory);
            }
        });

        suite('memory access patterns', function() {
            if (access) {
                testAccessPatterns(cpuFactory);
            }
        });

        suite('interrupt handling', function() {
            if (interrupt) {
                testInterrupt(cpuFactory);
            }
        });
    });
}

run(bus => new BatchedAddressCp(bus), 'standard CPU');

if (process.env['TEST_STATE_MACHINE_CPU']) {
    run(bus => new StateMachineCpu(bus), 'state machine CPU', {
        undocumented: false,
        interrupt: false
    });
}
