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

import Cpu from '../../../../src/machine/cpu/BatchedAccessCpu';

import { run as testInterrupt } from './testInterrupt';
import Runner from './Runner';

function run(cpuFactory: Runner.CpuFactory, cpuName: string) {
    suite(`CPU [${cpuName}]`, function() {
        suite('opcodes', function() {
            testBranches(cpuFactory);

            testFlagToggles(cpuFactory);

            testArithmetics(cpuFactory);

            testOtherOpcodes(cpuFactory);
        });

        suite('undocumented opcodes', function() {
            testUndocumentedOpcodes(cpuFactory);
        });

        suite('memory access patterns', function() {
            testAccessPatterns(cpuFactory);
        });

        suite('interrupt handling', function() {
            testInterrupt(cpuFactory);
        });
    });
}

run(bus => new Cpu(bus), 'standard CPU');
