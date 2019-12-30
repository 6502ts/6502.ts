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
import * as util from './util';

export function run(cpuFactory: Runner.CpuFactory) {
    suite('ASL', function() {
        util.testImplied(
            cpuFactory,
            0x0a,
            2,
            {
                a: 0xff,
                flags: CpuInterface.Flags.e
            },
            {
                a: 0xfe,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n | CpuInterface.Flags.c
            },
            ', 0xFF'
        );

        util.testImplied(
            cpuFactory,
            0x0a,
            2,
            {
                a: parseInt('01010101', 2),
                flags: CpuInterface.Flags.e
            },
            {
                a: parseInt('10101010', 2),
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', pattern'
        );

        util.testImplied(
            cpuFactory,
            0x0a,
            2,
            {
                a: 0x80,
                flags: CpuInterface.Flags.e
            },
            {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z | CpuInterface.Flags.c
            },
            ', 0x01'
        );

        util.testMutatingZeropage(
            cpuFactory,
            0x06,
            0xff,
            0xfe,
            5,
            {
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n | CpuInterface.Flags.c
            },
            ', 0xFF'
        );

        util.testMutatingZeropage(
            cpuFactory,
            0x06,
            parseInt('01010101', 2),
            parseInt('10101010', 2),
            5,
            {
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', pattern'
        );

        util.testMutatingZeropage(
            cpuFactory,
            0x06,
            0x80,
            0x00,
            5,
            {
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z | CpuInterface.Flags.c
            },
            ', 0x01'
        );

        util.testMutatingZeropageX(cpuFactory, 0x16, 0x01, 0x02, 6, { a: 0x02 }, {});
        util.testMutatingAbsolute(cpuFactory, 0x0e, 0x01, 0x02, 6, { a: 0x02 }, {});
        util.testMutatingAbsoluteX(cpuFactory, 0x1e, 0x01, 0x02, 7, 7, { a: 0x02 }, {});
    });

    suite('AND', function() {
        test('immediate, flags', () =>
            Runner.create(cpuFactory, [0x29, 0xff])
                .setState({
                    a: 0xf0,
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0xf0,
                    flags: 0xff & ~CpuInterface.Flags.z
                }));

        test('zeroPage, flags', () =>
            Runner.create(cpuFactory, [0x25, 0x34])
                .setState({
                    a: 0x0f,
                    flags: 0xff & ~CpuInterface.Flags.z
                })
                .poke({
                    '0x0034': 0xf0
                })
                .run()
                .assertCycles(3)
                .assertState({
                    a: 0x00,
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('zeroPage,X, flags', () =>
            Runner.create(cpuFactory, [0x35, 0x33])
                .setState({
                    a: 0x01,
                    x: 0x01,
                    flags: 0xff
                })
                .poke({
                    '0x0034': 0xff
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x01,
                    flags: 0xff & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
                }));

        test('absolute', () =>
            Runner.create(cpuFactory, [0x2d, 0x33, 0x44])
                .setState({
                    a: 0x01
                })
                .poke({
                    '0x4433': 0xff
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x01
                }));

        test('absolute,X', () =>
            Runner.create(cpuFactory, [0x3d, 0x44, 0x33])
                .setState({
                    a: 0x01,
                    x: 0x01
                })
                .poke({
                    '0x3345': 0xff
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x01
                }));

        test('absolute,X , page crossing', () =>
            Runner.create(cpuFactory, [0x3d, 0x44, 0x33])
                .setState({
                    a: 0x01,
                    x: 0xff
                })
                .poke({
                    '0x3443': 0xff
                })
                .run()
                .assertCycles(5)
                .assertState({
                    a: 0x01
                }));

        test('absolute,Y', () =>
            Runner.create(cpuFactory, [0x39, 0x44, 0x33])
                .setState({
                    a: 0x01,
                    y: 0x01
                })
                .poke({
                    '0x3345': 0xff
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x01
                }));

        test('absolute,Y , page crossing', () =>
            Runner.create(cpuFactory, [0x39, 0x44, 0x33])
                .setState({
                    a: 0x01,
                    y: 0xff
                })
                .poke({
                    '0x3443': 0xff
                })
                .run()
                .assertCycles(5)
                .assertState({
                    a: 0x01
                }));

        test('indirect.X', () =>
            Runner.create(cpuFactory, [0x21, 0x33])
                .setState({
                    a: 0x01,
                    x: 0x01
                })
                .poke({
                    '0x0034': 0x45,
                    '0x0035': 0x33,
                    '0x3345': 0xff
                })
                .run()
                .assertCycles(6)
                .assertState({
                    a: 0x01
                }));

        test('indirect,Y', () =>
            Runner.create(cpuFactory, [0x31, 0x33])
                .setState({
                    a: 0x01,
                    y: 0x01
                })
                .poke({
                    '0x0033': 0x45,
                    '0x0034': 0x33,
                    '0x3346': 0xff
                })
                .run()
                .assertCycles(5)
                .assertState({
                    a: 0x01
                }));

        test('indirect,Y , page crossing', () =>
            Runner.create(cpuFactory, [0x31, 0x33])
                .setState({
                    a: 0x01,
                    y: 0xff
                })
                .poke({
                    '0x0033': 0x45,
                    '0x0034': 0x33,
                    '0x3444': 0xff
                })
                .run()
                .assertCycles(6)
                .assertState({
                    a: 0x01
                }));
    });

    suite('BIT', function() {
        util.testDereferencingZeropage(
            cpuFactory,
            0x24,
            CpuInterface.Flags.n,
            3,
            {
                flags: CpuInterface.Flags.e,
                a: 0
            },
            {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.e
            },
            ', n'
        );

        util.testDereferencingAbsolute(
            cpuFactory,
            0x2c,
            CpuInterface.Flags.n | CpuInterface.Flags.v,
            4,
            {
                flags: CpuInterface.Flags.e,
                a: 0
            },
            {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.v
            },
            ', n | v'
        );

        util.testDereferencingAbsolute(
            cpuFactory,
            0x2c,
            CpuInterface.Flags.n | CpuInterface.Flags.v,
            4,
            {
                flags: CpuInterface.Flags.e,
                a: 0xff
            },
            {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.e | CpuInterface.Flags.v
            },
            ', n | v, a = 0xFF'
        );

        util.testDereferencingAbsolute(
            cpuFactory,
            0x2c,
            0x01,
            4,
            {
                flags: CpuInterface.Flags.e,
                a: 0x01
            },
            {
                flags: CpuInterface.Flags.e
            },
            ', 0x01, a = 0xFF'
        );
    });

    suite('BRK', function() {
        test('immediate', () =>
            Runner.create(cpuFactory, [0x00])
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0xff
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34
                })
                .run()
                .assertCycles(7)
                .assertState({
                    flags: CpuInterface.Flags.i | CpuInterface.Flags.z | CpuInterface.Flags.e,
                    p: 0x3412,
                    s: 0xfc
                })
                .assertMemory({
                    '0x01FF': 0xe0,
                    '0x01FE': 0x02,
                    '0x01FD': CpuInterface.Flags.z | CpuInterface.Flags.b | CpuInterface.Flags.e
                }));

        test('immediate, stack overflow', () =>
            Runner.create(cpuFactory, [0x00])
                .setState({
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e,
                    s: 0x01
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34
                })
                .run()
                .assertCycles(7)
                .assertState({
                    flags: CpuInterface.Flags.i | CpuInterface.Flags.z | CpuInterface.Flags.e,
                    p: 0x3412,
                    s: 0xfe
                })
                .assertMemory({
                    '0x0101': 0xe0,
                    '0x0100': 0x02,
                    '0x01FF': CpuInterface.Flags.z | CpuInterface.Flags.b | CpuInterface.Flags.e
                }));
    });

    suite('CMP', function() {
        test('immediate, flags', () =>
            Runner.create(cpuFactory, [0xc9, 0xff])
                .setState({
                    a: 0,
                    flags: 0xff
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.c & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
                }));

        test('zero page, flags', () =>
            Runner.create(cpuFactory, [0xc5, 0x55])
                .setState({
                    a: 0xff,
                    flags: 0xff & ~CpuInterface.Flags.c & ~CpuInterface.Flags.n
                })
                .poke({
                    '0x0055': 0x00
                })
                .run()
                .assertCycles(3)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.z
                }));

        test('zero page,X, flags', () =>
            Runner.create(cpuFactory, [0xd5, 0x55])
                .setState({
                    a: 0x34,
                    x: 0x01,
                    flags: 0xff & ~CpuInterface.Flags.c & ~CpuInterface.Flags.z
                })
                .poke({
                    '0x0056': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('absolute', () =>
            Runner.create(cpuFactory, [0xcd, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    flags: 0xff
                })
                .poke({
                    '0x3455': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('absolute,X', () =>
            Runner.create(cpuFactory, [0xdd, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    x: 0x01,
                    flags: 0xff
                })
                .poke({
                    '0x3456': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('absolute,X , page crossing', () =>
            Runner.create(cpuFactory, [0xdd, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    x: 0xff,
                    flags: 0xff
                })
                .poke({
                    '0x3554': 0x34
                })
                .run()
                .assertCycles(5)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('absolute,Y', () =>
            Runner.create(cpuFactory, [0xd9, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    y: 0x01,
                    flags: 0xff
                })
                .poke({
                    '0x3456': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('absolute,Y , page crossing', () =>
            Runner.create(cpuFactory, [0xd9, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    y: 0xff,
                    flags: 0xff
                })
                .poke({
                    '0x3554': 0x34
                })
                .run()
                .assertCycles(5)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('indirect,X', () =>
            Runner.create(cpuFactory, [0xc1, 0x55])
                .setState({
                    a: 0x34,
                    x: 0x01,
                    flags: 0xff
                })
                .poke({
                    '0x0056': 0x56,
                    '0x0057': 0x34,
                    '0x3456': 0x34
                })
                .run()
                .assertCycles(6)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('indirect,Y', () =>
            Runner.create(cpuFactory, [0xd1, 0x55])
                .setState({
                    a: 0x34,
                    y: 0x01,
                    flags: 0xff
                })
                .poke({
                    '0x0055': 0x56,
                    '0x0056': 0x34,
                    '0x3457': 0x34
                })
                .run()
                .assertCycles(5)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('indirect,Y , page crossing', () =>
            Runner.create(cpuFactory, [0xd1, 0x55])
                .setState({
                    a: 0x34,
                    y: 0xff,
                    flags: 0xff
                })
                .poke({
                    '0x0055': 0x56,
                    '0x0056': 0x34,
                    '0x3555': 0x34
                })
                .run()
                .assertCycles(6)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n
                }));
    });

    suite('CPX', function() {
        util.testImmediate(
            cpuFactory,
            0xe0,
            0x23,
            2,
            {
                x: 0x33,
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            ', flags'
        );

        util.testDereferencingZeropage(
            cpuFactory,
            0xe4,
            0x33,
            3,
            {
                x: 0x33,
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', flags'
        );

        util.testDereferencingAbsolute(
            cpuFactory,
            0xec,
            0xff,
            4,
            {
                x: 0xfe,
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', flags'
        );
    });

    suite('CPY', function() {
        util.testImmediate(
            cpuFactory,
            0xc0,
            0x23,
            2,
            {
                y: 0x33,
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            ', flags'
        );

        util.testDereferencingZeropage(
            cpuFactory,
            0xc4,
            0x33,
            3,
            {
                y: 0x33,
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', flags'
        );

        util.testDereferencingAbsolute(
            cpuFactory,
            0xcc,
            0xff,
            4,
            {
                y: 0xfe,
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', flags'
        );
    });

    suite('DEC', function() {
        util.testMutatingZeropage(
            cpuFactory,
            0xc6,
            0xff,
            0xfe,
            5,
            {
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.e
            }
        );

        util.testMutatingZeropageX(
            cpuFactory,
            0xd6,
            0x00,
            0xff,
            6,
            {
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.e
            }
        );

        util.testMutatingAbsolute(
            cpuFactory,
            0xce,
            0x01,
            0x00,
            6,
            {
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            }
        );

        util.testMutatingAbsoluteX(cpuFactory, 0xde, 0x05, 0x04, 7, 7, {}, {});
    });

    suite('DEX', function() {
        test('starting with 0x01, flags', () =>
            Runner.create(cpuFactory, [0xca])
                .setState({
                    x: 0x01,
                    flags: 0xff & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n,
                    x: 0
                }));

        test('starting with 0x00, flags', () =>
            Runner.create(cpuFactory, [0xca])
                .setState({
                    x: 0,
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.z,
                    x: 0xff
                }));
    });

    suite('DEY', function() {
        test('starting with 0x01, flags', () =>
            Runner.create(cpuFactory, [0x88])
                .setState({
                    y: 0x01,
                    flags: 0xff & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n,
                    y: 0
                }));

        test('starting with 0x00, flags', () =>
            Runner.create(cpuFactory, [0x88])
                .setState({
                    y: 0,
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.z,
                    y: 0xff
                }));
    });

    suite('EOR', function() {
        util.testImmediate(cpuFactory, 0x49, 0x3, 2, { a: 0x01 }, { a: 0x02 }, ', flags');
        util.testDereferencingZeropage(
            cpuFactory,
            0x45,
            0xff,
            3,
            {
                a: 0x7f,
                flags: CpuInterface.Flags.e
            },
            {
                a: 0x80,
                flags: CpuInterface.Flags.n | CpuInterface.Flags.e
            },
            ', flags'
        );
        util.testDereferencingZeropageX(
            cpuFactory,
            0x55,
            0xff,
            4,
            {
                a: 0xff,
                flags: CpuInterface.Flags.e
            },
            {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', flags'
        );
        util.testDereferencingAbsolute(cpuFactory, 0x4d, 0x3, 4, { a: 0x01 }, { a: 0x02 });
        util.testDereferencingAbsoluteX(cpuFactory, 0x5d, 0x3, 4, 5, { a: 0x01 }, { a: 0x02 });
        util.testDereferencingAbsoluteY(cpuFactory, 0x59, 0x3, 4, 5, { a: 0x01 }, { a: 0x02 });
        util.testDereferencingIndirectX(cpuFactory, 0x41, 0x3, 6, { a: 0x01 }, { a: 0x02 });
        util.testDereferencingIndirectY(cpuFactory, 0x51, 0x3, 5, 6, { a: 0x01 }, { a: 0x02 });
    });

    suite('INC', function() {
        util.testMutatingZeropage(cpuFactory, 0xe6, 0x11, 0x12, 5, {}, {}, ', 0x11');
        util.testMutatingZeropageX(
            cpuFactory,
            0xf6,
            0xef,
            0xf0,
            6,
            { flags: 0 },
            { flags: CpuInterface.Flags.n },
            ', 0xEF, flags'
        );
        util.testMutatingAbsolute(
            cpuFactory,
            0xee,
            0xff,
            0x00,
            6,
            { flags: 0 },
            { flags: CpuInterface.Flags.z },
            ', 0xFF, flags'
        );
        util.testMutatingAbsoluteX(cpuFactory, 0xfe, 0x11, 0x12, 7, 7, {}, {}, ', 0x11');
    });

    suite('INY', function() {
        test('starting with 0xFF, flags', () =>
            Runner.create(cpuFactory, [0xc8])
                .setState({
                    y: 0xff,
                    flags: 0xff & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.n,
                    y: 0
                }));

        test('starting with 0x7E, flags', () =>
            Runner.create(cpuFactory, [0xc8])
                .setState({
                    y: 0x7f,
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xff & ~CpuInterface.Flags.z,
                    y: 0x80
                }));
    });

    suite('INX', function() {
        util.testImplied(
            cpuFactory,
            0xe8,
            2,
            {
                x: 0xff,
                flags: CpuInterface.Flags.e
            },
            {
                x: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', 0xFF, flags'
        );

        util.testImplied(
            cpuFactory,
            0xe8,
            2,
            {
                x: 0xef,
                flags: CpuInterface.Flags.e
            },
            {
                x: 0xf0,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0xFF, flags'
        );
    });

    suite('JMP', function() {
        test('absolute', () =>
            Runner.create(cpuFactory, [0x4c, 0x67, 0xa1])
                .run()
                .assertCycles(3)
                .assertState({
                    p: 0xa167
                }));

        test('indirect', () =>
            Runner.create(cpuFactory, [0x6c, 0x67, 0xa1])
                .poke({
                    '0xA167': 0x34,
                    '0xA168': 0x56
                })
                .run()
                .assertCycles(5)
                .assertState({
                    p: 0x5634
                }));

        test('indirect, wraparound', () =>
            Runner.create(cpuFactory, [0x6c, 0xff, 0xa1])
                .poke({
                    '0xA1FF': 0x34,
                    '0xA100': 0x56
                })
                .run()
                .assertCycles(5)
                .assertState({
                    p: 0x5634
                }));
    });

    suite('JSR', function() {
        test('implied', () =>
            Runner.create(cpuFactory, [0x20, 0x67, 0xa1], 0xe000)
                .setState({
                    s: 0xff
                })
                .run()
                .assertCycles(6)
                .assertState({
                    p: 0xa167,
                    s: 0xfd
                })
                .assertMemory({
                    '0x01FE': 0x02,
                    '0x01FF': 0xe0
                }));

        test('stack overflow', () =>
            Runner.create(cpuFactory, [0x20, 0x67, 0xa1], 0xe000)
                .setState({
                    s: 0x00
                })
                .run()
                .assertCycles(6)
                .assertState({
                    p: 0xa167,
                    s: 0xfe
                })
                .assertMemory({
                    '0x01FF': 0x02,
                    '0x0100': 0xe0
                }));
    });

    suite('LDA', function() {
        test('immediate, 0x00, flags', () =>
            Runner.create(cpuFactory, [0xa9, 0])
                .setState({
                    a: 0x10,
                    flags: 0xff & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0,
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('zeroPage, 0xFF, flags', () =>
            Runner.create(cpuFactory, [0xa5, 0x12])
                .poke({
                    '0x12': 0xff
                })
                .setState({
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(3)
                .assertState({
                    a: 0xff,
                    flags: 0xff & ~CpuInterface.Flags.z
                }));

        test('zeroPage,X , wraparound, 0x34, flags', () =>
            Runner.create(cpuFactory, [0xb5, 0x12])
                .setState({
                    x: 0xfe,
                    flags: 0xff
                })
                .poke({
                    '0x10': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x34,
                    flags: 0xff & ~CpuInterface.Flags.z & ~CpuInterface.Flags.n
                }));

        test('absolute', () =>
            Runner.create(cpuFactory, [0xad, 0x12, 0x44])
                .poke({
                    '0x4412': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x34
                }));

        test('absolute,X', () =>
            Runner.create(cpuFactory, [0xbd, 0x12, 0x44])
                .setState({
                    x: 0x01
                })
                .poke({
                    '0x4413': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x34
                }));

        test('absolute,X , page crossing', () =>
            Runner.create(cpuFactory, [0xbd, 0xff, 0xff])
                .setState({
                    x: 0x02
                })
                .poke({
                    '0x0001': 0x34
                })
                .run()
                .assertCycles(5)
                .assertState({
                    a: 0x34
                }));

        test('absolute,Y', () =>
            Runner.create(cpuFactory, [0xb9, 0x12, 0x44])
                .setState({
                    y: 0x01
                })
                .poke({
                    '0x4413': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x34
                }));

        test('absolute,Y , page crossing', () =>
            Runner.create(cpuFactory, [0xb9, 0xff, 0xff])
                .setState({
                    y: 0x02
                })
                .poke({
                    '0x0001': 0x34
                })
                .run()
                .assertCycles(5)
                .assertState({
                    a: 0x34
                }));

        test('indirect,X , wraparound during sum', () =>
            Runner.create(cpuFactory, [0xa1, 0x32])
                .setState({
                    x: 0xfe
                })
                .poke({
                    '0x0030': 0x20,
                    '0x0031': 0x30,
                    '0x3020': 0x35
                })
                .run()
                .assertCycles(6)
                .assertState({
                    a: 0x35
                }));

        test('indirect,Y , wraparound during address read', () =>
            Runner.create(cpuFactory, [0xb1, 0xff])
                .setState({
                    y: 0x01
                })
                .poke({
                    '0x00FF': 0x20,
                    '0x0000': 0x30,
                    '0x3021': 0x36
                })
                .run()
                .assertCycles(5)
                .assertState({
                    a: 0x36
                }));

        test('indirect,Y , page crossing', () =>
            Runner.create(cpuFactory, [0xb1, 0xfe])
                .setState({
                    y: 0xff
                })
                .poke({
                    '0x00FE': 0x01,
                    '0x00FF': 0x30,
                    '0x3100': 0x36
                })
                .run()
                .assertCycles(6)
                .assertState({
                    a: 0x36
                }));
    });

    suite('LDX', function() {
        test('immediate, 0x00, flags', () =>
            Runner.create(cpuFactory, [0xa2, 0x00])
                .setState({
                    x: 0x10,
                    flags: 0xff & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    x: 0,
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('zeroPage, 0xFF, flags', () =>
            Runner.create(cpuFactory, [0xa6, 0x10])
                .poke({
                    '0x0010': 0xff
                })
                .setState({
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(3)
                .assertState({
                    x: 0xff,
                    flags: 0xff & ~CpuInterface.Flags.z
                }));

        test('zeroPage,Y , wraparound, 0x23, flags', () =>
            Runner.create(cpuFactory, [0xb6, 0x12])
                .poke({
                    '0x0011': 0x23
                })
                .setState({
                    y: 0xff,
                    flags: 0xff
                })
                .run()
                .assertCycles(4)
                .assertState({
                    x: 0x23,
                    flags: 0xff & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
                }));

        test('absolute', () =>
            Runner.create(cpuFactory, [0xae, 0x11, 0xae])
                .poke({
                    '0xAE11': 0x23
                })
                .run()
                .assertCycles(4)
                .assertState({
                    x: 0x23
                }));

        test('absolute,Y', () =>
            Runner.create(cpuFactory, [0xbe, 0x10, 0xae])
                .poke({
                    '0xAE11': 0x23
                })
                .setState({
                    y: 0x01
                })
                .run()
                .assertCycles(4)
                .assertState({
                    x: 0x23
                }));

        test('absolute,Y , page crossing', () =>
            Runner.create(cpuFactory, [0xbe, 0x02, 0xae])
                .poke({
                    '0xAF01': 0x23
                })
                .setState({
                    y: 0xff
                })
                .run()
                .assertCycles(5)
                .assertState({
                    x: 0x23
                }));
    });

    suite('LDY', function() {
        test('immediate, 0x00, flags', () =>
            Runner.create(cpuFactory, [0xa0, 0x00])
                .setState({
                    y: 0x10,
                    flags: 0xff & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    y: 0,
                    flags: 0xff & ~CpuInterface.Flags.n
                }));

        test('zeroPage, 0xFF, flags', () =>
            Runner.create(cpuFactory, [0xa4, 0x10])
                .poke({
                    '0x0010': 0xff
                })
                .setState({
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(3)
                .assertState({
                    y: 0xff,
                    flags: 0xff & ~CpuInterface.Flags.z
                }));

        test('zeroPage,X , 0x23, flags', () =>
            Runner.create(cpuFactory, [0xb4, 0x10])
                .poke({
                    '0x0011': 0x23
                })
                .setState({
                    x: 0x01,
                    flags: 0xff
                })
                .run()
                .assertCycles(4)
                .assertState({
                    y: 0x23,
                    flags: 0xff & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
                }));

        test('absolute', () =>
            Runner.create(cpuFactory, [0xac, 0x11, 0xae])
                .poke({
                    '0xAE11': 0x23
                })
                .run()
                .assertCycles(4)
                .assertState({
                    y: 0x23
                }));

        test('absolute,X', () =>
            Runner.create(cpuFactory, [0xbc, 0x10, 0xae])
                .poke({
                    '0xAE11': 0x23
                })
                .setState({
                    x: 0x01
                })
                .run()
                .assertCycles(4)
                .assertState({
                    y: 0x23
                }));

        test('absolute,X , page crossing', () =>
            Runner.create(cpuFactory, [0xbc, 0x02, 0xae])
                .poke({
                    '0xAF01': 0x23
                })
                .setState({
                    x: 0xff
                })
                .run()
                .assertCycles(5)
                .assertState({
                    y: 0x23
                }));
    });

    suite('LSR', function() {
        util.testImplied(
            cpuFactory,
            0x4a,
            2,
            {
                a: 0x01,
                flags: CpuInterface.Flags.e
            },
            {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01, flags'
        );

        util.testImplied(
            cpuFactory,
            0x4a,
            2,
            {
                a: 0x01,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01 + c, flags'
        );

        util.testImplied(
            cpuFactory,
            0x4a,
            2,
            {
                a: parseInt('10101010', 2)
            },
            {
                a: parseInt('01010101', 2)
            },
            ', pattern, flags'
        );

        util.testMutatingZeropage(
            cpuFactory,
            0x46,
            0x01,
            0x00,
            5,
            {
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01, flags'
        );

        util.testMutatingZeropageX(
            cpuFactory,
            0x56,
            0x01,
            0x00,
            6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01 + c, flags'
        );

        util.testMutatingAbsolute(
            cpuFactory,
            0x4e,
            parseInt('10101010', 2),
            parseInt('01010101', 2),
            6,
            {},
            {},
            ', pattern, flags'
        );

        util.testMutatingAbsolute(
            cpuFactory,
            0x5e,
            parseInt('10101010', 2),
            parseInt('01010101', 2),
            7,
            {},
            {},
            ', pattern, flags'
        );
    });

    suite('NOP', function() {
        test('implied', () =>
            Runner.create(cpuFactory, [0xea])
                .run()
                .assertCycles(2)
                .assertState());
    });

    suite('ORA', function() {
        util.testImmediate(
            cpuFactory,
            0x09,
            0x01,
            2,
            {
                a: 0x80,
                flags: CpuInterface.Flags.e
            },
            {
                a: 0x81,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            }
        );

        util.testDereferencingZeropage(
            cpuFactory,
            0x05,
            0x00,
            3,
            {
                a: 0x00,
                flags: CpuInterface.Flags.e
            },
            {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            }
        );

        util.testDereferencingZeropageX(cpuFactory, 0x15, 0x40, 4, { a: 0x04 }, { a: 0x44 });
        util.testDereferencingAbsolute(cpuFactory, 0x0d, 0x40, 4, { a: 0x04 }, { a: 0x44 });
        util.testDereferencingAbsoluteX(cpuFactory, 0x1d, 0x40, 4, 5, { a: 0x04 }, { a: 0x44 });
        util.testDereferencingAbsoluteY(cpuFactory, 0x19, 0x40, 4, 5, { a: 0x04 }, { a: 0x44 });
        util.testDereferencingIndirectX(cpuFactory, 0x01, 0x40, 6, { a: 0x04 }, { a: 0x44 });
        util.testDereferencingIndirectY(cpuFactory, 0x11, 0x40, 5, 6, { a: 0x04 }, { a: 0x44 });
    });

    suite('PHA', function() {
        test('implied', () =>
            Runner.create(cpuFactory, [0x48])
                .setState({
                    a: 0xff,
                    s: 0xff
                })
                .run()
                .assertCycles(3)
                .assertState({
                    s: 0xfe
                })
                .assertMemory({
                    '0x01FF': 0xff
                }));

        test('implied, stack overflow', () =>
            Runner.create(cpuFactory, [0x48])
                .setState({
                    a: 0xe8,
                    s: 0x00
                })
                .run()
                .assertCycles(3)
                .assertState({
                    s: 0xff
                })
                .assertMemory({
                    '0x0100': 0xe8
                }));
    });

    suite('PHP', function() {
        test('implied', () =>
            Runner.create(cpuFactory, [0x08])
                .setState({
                    flags: 0xff,
                    s: 0xff
                })
                .run()
                .assertCycles(3)
                .assertState({
                    s: 0xfe
                })
                .assertMemory({
                    '0x01FF': 0xff
                }));

        test('implied, stack overflow', () =>
            Runner.create(cpuFactory, [0x08])
                .setState({
                    flags: 0xe8,
                    s: 0x00
                })
                .run()
                .assertCycles(3)
                .assertState({
                    s: 0xff
                })
                .assertMemory({
                    '0x0100': 0xe8 | CpuInterface.Flags.b
                }));
    });

    suite('PLP', function() {
        test('implied', () =>
            Runner.create(cpuFactory, [0x28])
                .setState({
                    flags: 0,
                    s: 0xfe
                })
                .poke({
                    '0x01FF': 0xff
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0xff,
                    flags: 0xff & ~CpuInterface.Flags.b
                }));

        test('implied, e and b flag handling', () =>
            Runner.create(cpuFactory, [0x28])
                .setState({
                    flags: 0,
                    s: 0xfe
                })
                .poke({
                    '0x01FF': CpuInterface.Flags.b
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0xff,
                    flags: CpuInterface.Flags.e
                }));

        test('implied, stack underflow', () =>
            Runner.create(cpuFactory, [0x28])
                .setState({
                    flags: 0,
                    s: 0xff
                })
                .poke({
                    '0x0100': 0xa7
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0x00,
                    flags: 0xa7 & ~CpuInterface.Flags.b
                }));
    });

    suite('PLA', function() {
        test('implied', () =>
            Runner.create(cpuFactory, [0x68])
                .setState({
                    a: 0,
                    s: 0xfe,
                    flags: CpuInterface.Flags.e
                })
                .poke({
                    '0x01FF': 0xff
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0xff,
                    a: 0xff,
                    flags: CpuInterface.Flags.e | CpuInterface.Flags.n
                }));

        test('implied, stack underflow', () =>
            Runner.create(cpuFactory, [0x68])
                .setState({
                    a: 0xff,
                    s: 0xff,
                    flags: CpuInterface.Flags.e
                })
                .poke({
                    '0x0100': 0x00
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0x00,
                    a: 0x00,
                    flags: CpuInterface.Flags.e | CpuInterface.Flags.z
                }));
    });

    suite('ROL', function() {
        util.testImplied(
            cpuFactory,
            0x2a,
            2,
            {
                a: 0x80,
                flags: CpuInterface.Flags.e
            },
            {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x80, flags'
        );

        util.testImplied(
            cpuFactory,
            0x2a,
            2,
            {
                a: 0x80,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                a: 0x01,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            ', 0x80 + c, flags'
        );

        util.testImplied(
            cpuFactory,
            0x2a,
            2,
            {
                a: 0x40,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                a: 0x81,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0x40 + c, flags'
        );

        util.testMutatingZeropage(
            cpuFactory,
            0x26,
            0x80,
            0x00,
            5,
            {
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x80, flags'
        );

        util.testMutatingZeropageX(
            cpuFactory,
            0x36,
            0x80,
            0x01,
            6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            ', 0x80 + c, flags'
        );

        util.testMutatingAbsolute(
            cpuFactory,
            0x2e,
            0x40,
            0x81,
            6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0x40 + c, flags'
        );

        util.testMutatingAbsoluteX(cpuFactory, 0x3e, 0x01, 0x02, 7, 7, {}, {});
    });

    suite('ROR', function() {
        util.testImplied(
            cpuFactory,
            0x6a,
            2,
            {
                a: 0x01,
                flags: CpuInterface.Flags.e
            },
            {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01, flags'
        );

        util.testImplied(
            cpuFactory,
            0x6a,
            2,
            {
                a: 0x01,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                a: 0x80,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.n
            },
            ', 0x01 + c, flags'
        );

        util.testImplied(
            cpuFactory,
            0x6a,
            2,
            {
                a: 0x40,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                a: 0xa0,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0x40 + c, flags'
        );

        util.testMutatingZeropage(
            cpuFactory,
            0x66,
            0x01,
            0x00,
            5,
            {
                flags: CpuInterface.Flags.e
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01, flags'
        );

        util.testMutatingZeropageX(
            cpuFactory,
            0x76,
            0x01,
            0x80,
            6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.n
            },
            ', 0x01 + c, flags'
        );

        util.testMutatingAbsolute(
            cpuFactory,
            0x6e,
            0x40,
            0xa0,
            6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0x40 + c, flags'
        );

        util.testMutatingAbsoluteX(cpuFactory, 0x7e, 0x02, 0x01, 7, 7, {}, {});
    });

    suite('RTI', function() {
        test('implied', () =>
            Runner.create(cpuFactory, [0x40])
                .setState({
                    s: 0xfc,
                    flags: CpuInterface.Flags.d
                })
                .poke({
                    '0x01FD': CpuInterface.Flags.z | CpuInterface.Flags.b,
                    '0x01FE': 0x45,
                    '0x01FF': 0x67
                })
                .run()
                .assertCycles(6)
                .assertState({
                    s: 0xff,
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e
                }));

        test('implied, stack underflow', () =>
            Runner.create(cpuFactory, [0x40])
                .setState({
                    s: 0xfe,
                    flags: CpuInterface.Flags.d
                })
                .poke({
                    '0x01FF': CpuInterface.Flags.z | CpuInterface.Flags.b,
                    '0x0100': 0x45,
                    '0x0101': 0x67
                })
                .run()
                .assertCycles(6)
                .assertState({
                    s: 0x01,
                    p: 0x6745,
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.e
                }));
    });

    suite('RTS', function() {
        test('implied', () =>
            Runner.create(cpuFactory, [0x60])
                .setState({
                    s: 0xfd
                })
                .poke({
                    '0x01FE': 0xcc,
                    '0x01FF': 0xab
                })
                .run()
                .assertCycles(6)
                .assertState({
                    s: 0xff,
                    p: 0xabcd
                }));

        test('stack underflow', () =>
            Runner.create(cpuFactory, [0x60])
                .setState({
                    s: 0xfe
                })
                .poke({
                    '0x01FF': 0xcc,
                    '0x0100': 0xab
                })
                .run()
                .assertCycles(6)
                .assertState({
                    s: 0x00,
                    p: 0xabcd
                }));
    });

    suite('STA', function() {
        test('zeroPage , flags', () =>
            Runner.create(cpuFactory, [0x85, 0x10])
                .setState({
                    a: 0x45,
                    flags: 0xff
                })
                .run()
                .assertCycles(3)
                .assertState()
                .assertMemory({
                    '0x0010': 0x45
                }));

        test('zeroPage,X', () =>
            Runner.create(cpuFactory, [0x95, 0x10])
                .setState({
                    a: 0x45,
                    x: 0x04
                })
                .run()
                .assertCycles(4)
                .assertState()
                .assertMemory({
                    '0x0014': 0x45
                }));

        test('absolute', () =>
            Runner.create(cpuFactory, [0x8d, 0x10, 0x11])
                .setState({
                    a: 0x45
                })
                .run()
                .assertCycles(4)
                .assertState()
                .assertMemory({
                    '0x1110': 0x45
                }));

        test('absolute,X', () =>
            Runner.create(cpuFactory, [0x9d, 0x10, 0x11])
                .setState({
                    a: 0x45,
                    x: 0x10
                })
                .run()
                .assertCycles(5)
                .assertState()
                .assertMemory({
                    '0x1120': 0x45
                }));

        test('absolute,X , page crossing', () =>
            Runner.create(cpuFactory, [0x9d, 0x10, 0x11])
                .setState({
                    a: 0x45,
                    x: 0xff
                })
                .run()
                .assertCycles(5)
                .assertState()
                .assertMemory({
                    '0x120F': 0x45
                }));

        test('absolute,Y', () =>
            Runner.create(cpuFactory, [0x99, 0x10, 0x11])
                .setState({
                    a: 0x45,
                    y: 0x10
                })
                .run()
                .assertCycles(5)
                .assertState()
                .assertMemory({
                    '0x1120': 0x45
                }));

        test('absolute,Y , page crossing', () =>
            Runner.create(cpuFactory, [0x99, 0x10, 0x11])
                .setState({
                    a: 0x45,
                    y: 0xff
                })
                .run()
                .assertCycles(5)
                .assertState()
                .assertMemory({
                    '0x120F': 0x45
                }));

        test('indirect,X , wraparound during address read', () =>
            Runner.create(cpuFactory, [0x81, 0xfe])
                .setState({
                    a: 0x45,
                    x: 0x01
                })
                .poke({
                    '0x00FF': 0x0f,
                    '0x0000': 0x12
                })
                .run()
                .assertCycles(6)
                .assertState()
                .assertMemory({
                    '0x120F': 0x45
                }));

        test('indirect,Y', () =>
            Runner.create(cpuFactory, [0x91, 0x50])
                .setState({
                    a: 0x45,
                    y: 0x05
                })
                .poke({
                    '0x0050': 0x01,
                    '0x0051': 0x12
                })
                .run()
                .assertCycles(6)
                .assertState()
                .assertMemory({
                    '0x1206': 0x45
                }));

        test('indirect,Y , page crossing', () =>
            Runner.create(cpuFactory, [0x91, 0x50])
                .setState({
                    a: 0x45,
                    y: 0xfe
                })
                .poke({
                    '0x0050': 0x03,
                    '0x0051': 0x12
                })
                .run()
                .assertCycles(6)
                .assertState()
                .assertMemory({
                    '0x1301': 0x45
                }));
    });

    suite('STX', function() {
        test('zeroPage', () =>
            Runner.create(cpuFactory, [0x86, 0x45])
                .setState({
                    x: 0x24
                })
                .run()
                .assertCycles(3)
                .assertMemory({
                    '0x0045': 0x24
                }));

        test('zeroPage,Y', () =>
            Runner.create(cpuFactory, [0x96, 0x45])
                .setState({
                    x: 0x24,
                    y: 0x01
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x0046': 0x24
                }));

        test('absolute', () =>
            Runner.create(cpuFactory, [0x8e, 0x45, 0x73])
                .setState({
                    x: 0x24
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x7345': 0x24
                }));
    });

    suite('STY', function() {
        test('zeroPage', () =>
            Runner.create(cpuFactory, [0x84, 0x45])
                .setState({
                    y: 0x24
                })
                .run()
                .assertCycles(3)
                .assertMemory({
                    '0x0045': 0x24
                }));

        test('zeroPage,X', () =>
            Runner.create(cpuFactory, [0x94, 0x45])
                .setState({
                    y: 0x24,
                    x: 0x01
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x0046': 0x24
                }));

        test('absolute', () =>
            Runner.create(cpuFactory, [0x8c, 0x45, 0x73])
                .setState({
                    y: 0x24
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x7345': 0x24
                }));
    });

    suite('TAX', function() {
        util.testImplied(
            cpuFactory,
            0xaa,
            2,
            {
                a: 0xff,
                x: 0,
                flags: CpuInterface.Flags.e
            },
            {
                x: 0xff,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0xFF, flags'
        );

        util.testImplied(
            cpuFactory,
            0xaa,
            2,
            {
                a: 0x00,
                x: 0xff,
                flags: CpuInterface.Flags.e
            },
            {
                x: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', 0x00, flags'
        );
    });

    suite('TAY', function() {
        util.testImplied(
            cpuFactory,
            0xa8,
            2,
            {
                a: 0xff,
                y: 0,
                flags: CpuInterface.Flags.e
            },
            {
                y: 0xff,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0xFF, flags'
        );

        util.testImplied(
            cpuFactory,
            0xa8,
            2,
            {
                a: 0x00,
                y: 0xff,
                flags: CpuInterface.Flags.e
            },
            {
                y: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', 0x00, flags'
        );
    });

    suite('TSX', function() {
        util.testImplied(
            cpuFactory,
            0xba,
            2,
            {
                s: 0x45,
                x: 0x00,
                flags: 0xff
            },
            {
                x: 0x45,
                flags: 0xff & ~CpuInterface.Flags.z & ~CpuInterface.Flags.n
            }
        );
    });

    suite('TXA', function() {
        util.testImplied(
            cpuFactory,
            0x8a,
            2,
            {
                x: 0x11,
                a: 0x00
            },
            {
                x: 0x11,
                a: 0x11
            },
            ', 0x11'
        );

        util.testImplied(
            cpuFactory,
            0x8a,
            2,
            {
                x: 0xff,
                a: 0x00,
                flags: CpuInterface.Flags.e
            },
            {
                x: 0xff,
                a: 0xff,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0xFF'
        );

        util.testImplied(
            cpuFactory,
            0x8a,
            2,
            {
                x: 0x00,
                a: 0xff,
                flags: CpuInterface.Flags.e
            },
            {
                x: 0x00,
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', 0x00'
        );
    });

    suite('TXS', function() {
        test('implied, flags', () =>
            Runner.create(cpuFactory, [0x9a])
                .setState({
                    x: 0xde,
                    s: 0x00,
                    flags: 0xff
                })
                .run()
                .assertCycles(2)
                .assertState({
                    s: 0xde
                }));
    });

    suite('TYA', function() {
        test('implied, flags', () =>
            Runner.create(cpuFactory, [0x98])
                .setState({
                    y: 0xff,
                    a: 0,
                    flags: 0xff & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0xff,
                    flags: 0xff & ~CpuInterface.Flags.z
                }));
    });
}
