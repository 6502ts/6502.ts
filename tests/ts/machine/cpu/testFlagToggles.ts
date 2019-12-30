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

function clearFlagSuite(cpuFactory: Runner.CpuFactory, mnemonic: string, opcode: number, flag: number) {
    suite(mnemonic, function() {
        test('implied', () =>
            Runner.create(cpuFactory, [opcode])
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

function setFlagSuite(cpuFactory: Runner.CpuFactory, mnemonic: string, opcode: number, flag: number) {
    suite(mnemonic, function() {
        test('implied', () =>
            Runner.create(cpuFactory, [opcode])
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

export function run(cpuFactory: Runner.CpuFactory): void {
    clearFlagSuite(cpuFactory, 'CLC', 0x18, CpuInterface.Flags.c);

    clearFlagSuite(cpuFactory, 'CLD', 0xd8, CpuInterface.Flags.d);

    clearFlagSuite(cpuFactory, 'CLI', 0x58, CpuInterface.Flags.i);

    clearFlagSuite(cpuFactory, 'CLV', 0xb8, CpuInterface.Flags.v);

    setFlagSuite(cpuFactory, 'SEC', 0x38, CpuInterface.Flags.c);

    setFlagSuite(cpuFactory, 'SED', 0xf8, CpuInterface.Flags.d);

    setFlagSuite(cpuFactory, 'SEI', 0x78, CpuInterface.Flags.i);
}
