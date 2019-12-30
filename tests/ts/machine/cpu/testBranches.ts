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

import Runner from './Runner';
import CpuInterface from '../../../../src/machine/cpu/CpuInterface';

function branchSuite(
    cpuFactory: Runner.CpuFactory,
    mnemonic: string,
    opcode: number,
    jumpCondition: number,
    noJumpCondition: number
): void {
    suite(mnemonic, function() {
        test('immediate, no branch', () =>
            Runner.create(cpuFactory, [opcode, 0x0f], 0xe000)
                .setState({
                    flags: noJumpCondition
                })
                .run()
                .assertCycles(2)
                .assertState({
                    p: 0xe000 + 2
                }));

        test('immediate, forward branch', () =>
            Runner.create(cpuFactory, [opcode, 0x0f], 0xe000)
                .setState({
                    flags: jumpCondition
                })
                .run()
                .assertCycles(3)
                .assertState({
                    p: 0xe000 + 2 + 0x0f
                }));

        test('immediate, backward branch, page crossing', () =>
            Runner.create(cpuFactory, [opcode, (~0x0a & 0xff) + 1], 0xe000)
                .setState({
                    flags: jumpCondition
                })
                .run()
                .assertCycles(4)
                .assertState({
                    p: 0xe000 + 2 - 0x0a
                }));

        test('immediate, backward branch, page crossing @ 0xFE', () =>
            Runner.create(cpuFactory, [opcode, (~0x0a & 0xff) + 1], 0xe0fe)
                .setState({
                    flags: jumpCondition
                })
                .run()
                .assertCycles(4)
                .assertState({
                    p: 0xe0fe + 2 - 0x0a
                }));

        test('immediate, backward branch, page crossing @ 0xFF', () =>
            Runner.create(cpuFactory, [opcode, (~0x0a & 0xff) + 1], 0xe0ff)
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

export function run(cpuFactory: Runner.CpuFactory): void {
    branchSuite(cpuFactory, 'BCC', 0x90, 0, CpuInterface.Flags.c);

    branchSuite(cpuFactory, 'BNE', 0xd0, 0, CpuInterface.Flags.z);

    branchSuite(cpuFactory, 'BEQ', 0xf0, CpuInterface.Flags.z, 0);

    branchSuite(cpuFactory, 'BPL', 0x10, 0, CpuInterface.Flags.n);

    branchSuite(cpuFactory, 'BMI', 0x30, CpuInterface.Flags.n, 0);

    branchSuite(cpuFactory, 'BVC', 0x50, 0, CpuInterface.Flags.v);

    branchSuite(cpuFactory, 'BVS', 0x70, CpuInterface.Flags.v, 0);
}
