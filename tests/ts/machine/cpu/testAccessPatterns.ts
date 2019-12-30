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
import AccessLog from './AccessLog';

export function run(cpuFactory: Runner.CpuFactory) {
    suite('addressing patterns', function() {
        test('absolute,X via LDA', () =>
            Runner.create(cpuFactory, [0xbd, 0x00, 0xa0], 0xe000)
                .setState({
                    x: 0x05
                })
                .run()
                .assertAccessLog(
                    AccessLog.create()
                        .read(0xe000)
                        .read(0xe001)
                        .read(0xe002)
                        .read(0xa005)
                ));

        test('absolute,X via LDA (page crossing)', () =>
            Runner.create(cpuFactory, [0xbd, 0xff, 0xa0], 0xe000)
                .setState({
                    x: 0x05
                })
                .run()
                .assertAccessLog(
                    AccessLog.create()
                        .read(0xe000)
                        .read(0xe001)
                        .read(0xe002)
                        .read(0xa004)
                        .read(0xa104)
                ));

        test('absolute,Y via LDA', () =>
            Runner.create(cpuFactory, [0xb9, 0x00, 0xa0], 0xe000)
                .setState({
                    y: 0x05
                })
                .run()
                .assertAccessLog(
                    AccessLog.create()
                        .read(0xe000)
                        .read(0xe001)
                        .read(0xe002)
                        .read(0xa005)
                ));

        test('absolute,Y via LDA (page crossing)', () =>
            Runner.create(cpuFactory, [0xb9, 0xff, 0xa0], 0xe000)
                .setState({
                    y: 0x05
                })
                .run()
                .assertAccessLog(
                    AccessLog.create()
                        .read(0xe000)
                        .read(0xe001)
                        .read(0xe002)
                        .read(0xa004)
                        .read(0xa104)
                ));

        test('zeropage,X via LDA', () =>
            Runner.create(cpuFactory, [0xb5, 0x01], 0xe000)
                .setState({
                    x: 0x05
                })
                .run()
                .assertAccessLog(
                    AccessLog.create()
                        .read(0xe000)
                        .read(0xe001)
                        .read(0x0001)
                        .read(0x0006)
                ));

        test('zeropage,Y via LDX', () =>
            Runner.create(cpuFactory, [0xb6, 0x01], 0xe000)
                .setState({
                    y: 0x05
                })
                .run()
                .assertAccessLog(
                    AccessLog.create()
                        .read(0xe000)
                        .read(0xe001)
                        .read(0x0001)
                        .read(0x0006)
                ));

        test('indexed,X via LDA', () =>
            Runner.create(cpuFactory, [0xa1, 0x01], 0xe000)
                .setState({
                    x: 0x05
                })
                .poke({
                    '0x06': 0x03,
                    '0x07': 0xa0
                })
                .run()
                .assertAccessLog(
                    AccessLog.create()
                        .read(0xe000)
                        .read(0xe001)
                        .read(0x0001)
                        .read(0x0006)
                        .read(0x0007)
                        .read(0xa003)
                ));

        test('indexed,Y via LDA', () =>
            Runner.create(cpuFactory, [0xb1, 0x02], 0xe000)
                .setState({
                    y: 0x05
                })
                .poke({
                    '0x0002': 0x13,
                    '0x0003': 0xb0
                })
                .run()
                .assertAccessLog(
                    AccessLog.create()
                        .read(0xe000)
                        .read(0xe001)
                        .read(0x0002)
                        .read(0x0003)
                        .read(0xb018)
                ));

        test('indexed,Y via LDA (page crossing)', () =>
            Runner.create(cpuFactory, [0xb1, 0x02], 0xe000)
                .setState({
                    y: 0xff
                })
                .poke({
                    '0x0002': 0x13,
                    '0x0003': 0xb0
                })
                .run()
                .assertAccessLog(
                    AccessLog.create()
                        .read(0xe000)
                        .read(0xe001)
                        .read(0x0002)
                        .read(0x0003)
                        .read(0xb012)
                        .read(0xb112)
                ));
    });
}
