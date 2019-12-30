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

run(bus => new BatchedAddressCp(bus), 'batched access CPU');
run(bus => new StateMachineCpu(bus), 'state machine CPU');
