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
import AccessLog from './AccessLog';

export function run() {
    suite('addressing patterns', function() {
        test('absolute,X via LDA', () =>
            Runner.create([0xbd, 0x00, 0xa0], 0xe000)
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
            Runner.create([0xbd, 0xff, 0xa0], 0xe000)
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
            Runner.create([0xb9, 0x00, 0xa0], 0xe000)
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
            Runner.create([0xb9, 0xff, 0xa0], 0xe000)
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
            Runner.create([0xb5, 0x01], 0xe000)
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
            Runner.create([0xb6, 0x01], 0xe000)
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
            Runner.create([0xa1, 0x01], 0xe000)
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
            Runner.create([0xb1, 0x02], 0xe000)
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
            Runner.create([0xb1, 0x02], 0xe000)
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
