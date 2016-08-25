import Runner from './Runner';
import CpuInterface from '../../../src/machine/cpu/CpuInterface';
import * as util from './util';

export function run() {

    suite('ASL', function() {

        util.testImplied(0x0A, 2,
            {
                a: 0xFF,
                flags: CpuInterface.Flags.e
            }, {
                a: 0xFE,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n  | CpuInterface.Flags.c
            },
            ', 0xFF'
        );

        util.testImplied(0x0A, 2,
            {
                a: parseInt('01010101', 2),
                flags: CpuInterface.Flags.e
            }, {
                a: parseInt('10101010', 2),
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', pattern'
        );

        util.testImplied(0x0A, 2,
            {
                a: 0x80,
                flags: CpuInterface.Flags.e
            }, {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z | CpuInterface.Flags.c
            },
            ', 0x01'
        );

        util.testMutatingZeropage(0x06, 0xFF, 0xFE, 5,
            {
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n  | CpuInterface.Flags.c
            },
            ', 0xFF'
        );

        util.testMutatingZeropage(0x06, parseInt('01010101', 2), parseInt('10101010', 2), 5,
            {
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', pattern'
        );

        util.testMutatingZeropage(0x06, 0x80, 0x00, 5,
            {
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z | CpuInterface.Flags.c
            },
            ', 0x01'
        );

        util.testMutatingZeropageX(0x16, 0x01, 0x02, 6, {a: 0x02}, {});
        util.testMutatingAbsolute(0x0E, 0x01, 0x02, 6, {a: 0x02}, {});
        util.testMutatingAbsoluteX(0x1E, 0x01, 0x02, 7, 7, {a: 0x02}, {});

    });

    suite('AND', function() {
        test('immediate, flags', () => Runner
                .create([0x29, 0xFF])
                .setState({
                    a: 0xF0,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0xF0,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
        );

        test('zeroPage, flags', () => Runner
                .create([0x25, 0x34])
                .setState({
                    a: 0x0F,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
                .poke({
                    '0x0034': 0xF0
                })
                .run()
                .assertCycles(3)
                .assertState({
                    a: 0x00,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('zeroPage,X, flags', () => Runner
                .create([0x35, 0x33])
                .setState({
                    a: 0x01,
                    x: 0x01,
                    flags: 0xFF
                })
                .poke({
                    '0x0034': 0xFF
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x01,
                    flags: 0xFF & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
                })
        );

        test('absolute', () => Runner
                .create([0x2D, 0x33, 0x44])
                .setState({
                    a: 0x01
                })
                .poke({
                    '0x4433': 0xFF
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x01
                })
        );

        test('absolute,X', () => Runner
                .create([0x3D, 0x44, 0x33])
                .setState({
                    a: 0x01,
                    x: 0x01
                })
                .poke({
                    '0x3345': 0xFF
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x01
                })
        );

        test('absolute,X , page crossing', () => Runner
                .create([0x3D, 0x44, 0x33])
                .setState({
                    a: 0x01,
                    x: 0xFF
                })
                .poke({
                    '0x3443': 0xFF
                })
                .run()
                .assertCycles(5)
                .assertState({
                    a: 0x01
                })
        );

        test('absolute,Y', () => Runner
                .create([0x39, 0x44, 0x33])
                .setState({
                    a: 0x01,
                    y: 0x01
                })
                .poke({
                    '0x3345': 0xFF
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x01
                })
        );

        test('absolute,Y , page crossing', () => Runner
                .create([0x39, 0x44, 0x33])
                .setState({
                    a: 0x01,
                    y: 0xFF
                })
                .poke({
                    '0x3443': 0xFF
                })
                .run()
                .assertCycles(5)
                .assertState({
                    a: 0x01
                })
        );

        test('indirect.X', () => Runner
                .create([0x21, 0x33])
                .setState({
                    a: 0x01,
                    x: 0x01
                })
                .poke({
                    '0x0034': 0x45,
                    '0x0035': 0x33,
                    '0x3345': 0xFF
                })
                .run()
                .assertCycles(6)
                .assertState({
                    a: 0x01
                })
        );

        test('indirect,Y', () => Runner
                .create([0x31, 0x33])
                .setState({
                    a: 0x01,
                    y: 0x01
                })
                .poke({
                    '0x0033': 0x45,
                    '0x0034': 0x33,
                    '0x3346': 0xFF
                })
                .run()
                .assertCycles(5)
                .assertState({
                    a: 0x01
                })
        );

        test('indirect,Y , page crossing', () => Runner
                .create([0x31, 0x33])
                .setState({
                    a: 0x01,
                    y: 0xFF
                })
                .poke({
                    '0x0033': 0x45,
                    '0x0034': 0x33,
                    '0x3444': 0xFF
                })
                .run()
                .assertCycles(6)
                .assertState({
                    a: 0x01
                })
        );

    });

    suite('BIT', function() {
        util.testDereferencingZeropage(0x24, CpuInterface.Flags.n, 3,
            {
                flags: CpuInterface.Flags.e,
                a: 0
            }, {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.e
            },
            ', n'
        );

        util.testDereferencingAbsolute(0x2C, CpuInterface.Flags.n | CpuInterface.Flags.v, 4,
            {
                flags: CpuInterface.Flags.e,
                a: 0
            }, {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.z | CpuInterface.Flags.e | CpuInterface.Flags.v
            },
            ', n | v'
        );

        util.testDereferencingAbsolute(0x2C, CpuInterface.Flags.n | CpuInterface.Flags.v, 4,
            {
                flags: CpuInterface.Flags.e,
                a: 0xFF
            }, {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.e | CpuInterface.Flags.v
            },
            ', n | v, a = 0xFF'
        );

        util.testDereferencingAbsolute(0x2C, 0x01, 4,
            {
                flags: CpuInterface.Flags.e,
                a: 0x01
            }, {
                flags: CpuInterface.Flags.e
            },
            ', 0x01, a = 0xFF'
        );
    });

    suite('BRK', function() {
        test('immediate', () => Runner
                .create([0x00])
                .setState({
                    flags: CpuInterface.Flags.z,
                    s: 0xFF
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34
                })
                .run()
                .assertCycles(7)
                .assertState({
                    flags: CpuInterface.Flags.i | CpuInterface.Flags.z,
                    p: 0x3412,
                    s: 0xFC
                })
                .assertMemory({
                    '0x01FF': 0xE0,
                    '0x01FE': 0x02,
                    '0x01FD': CpuInterface.Flags.z | CpuInterface.Flags.b
                })
        );

        test('immediate, stack overflow', () => Runner
                .create([0x00])
                .setState({
                    flags: CpuInterface.Flags.z,
                    s: 0x01
                })
                .poke({
                    '0xFFFE': 0x12,
                    '0xFFFF': 0x34
                })
                .run()
                .assertCycles(7)
                .assertState({
                    flags: CpuInterface.Flags.i | CpuInterface.Flags.z,
                    p: 0x3412,
                    s: 0xFE
                })
                .assertMemory({
                    '0x0101': 0xE0,
                    '0x0100': 0x02,
                    '0x01FF': CpuInterface.Flags.z | CpuInterface.Flags.b
                })
        );
    });

    suite('CMP', function() {
        test('immediate, flags', () => Runner
                .create([0xC9, 0xFF])
                .setState({
                    a: 0,
                    flags: 0xFF
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.c &~ CpuInterface.Flags.n &~ CpuInterface.Flags.z
                })
        );

        test('zero page, flags', () => Runner
                .create([0xC5, 0x55])
                .setState({
                    a: 0xFF,
                    flags: 0xFF & ~CpuInterface.Flags.c & ~CpuInterface.Flags.n
                })
                .poke({
                    '0x0055': 0x00
                })
                .run()
                .assertCycles(3)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
        );

        test('zero page,X, flags', () => Runner
                .create([0xD5, 0x55])
                .setState({
                    a: 0x34,
                    x: 0x01,
                    flags: 0xFF & ~CpuInterface.Flags.c & ~CpuInterface.Flags.z
                })
                .poke({
                    '0x0056': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('absolute', () => Runner
                .create([0xCD, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    flags: 0xFF
                })
                .poke({
                    '0x3455': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('absolute,X', () => Runner
                .create([0xDD, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    x: 0x01,
                    flags: 0xFF
                })
                .poke({
                    '0x3456': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('absolute,X , page crossing', () => Runner
                .create([0xDD, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    x: 0xFF,
                    flags: 0xFF
                })
                .poke({
                    '0x3554': 0x34
                })
                .run()
                .assertCycles(5)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('absolute,Y', () => Runner
                .create([0xD9, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    y: 0x01,
                    flags: 0xFF
                })
                .poke({
                    '0x3456': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('absolute,Y , page crossing', () => Runner
                .create([0xD9, 0x55, 0x34])
                .setState({
                    a: 0x34,
                    y: 0xFF,
                    flags: 0xFF
                })
                .poke({
                    '0x3554': 0x34
                })
                .run()
                .assertCycles(5)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('indirect,X', () => Runner
                .create([0xC1, 0x55])
                .setState({
                    a: 0x34,
                    x: 0x01,
                    flags: 0xFF
                })
                .poke({
                    '0x0056': 0x56,
                    '0x0057': 0x34,
                    '0x3456': 0x34
                })
                .run()
                .assertCycles(6)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('indirect,Y', () => Runner
                .create([0xD1, 0x55])
                .setState({
                    a: 0x34,
                    y: 0x01,
                    flags: 0xFF
                })
                .poke({
                    '0x0055': 0x56,
                    '0x0056': 0x34,
                    '0x3457': 0x34
                })
                .run()
                .assertCycles(5)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('indirect,Y , page crossing', () => Runner
                .create([0xD1, 0x55])
                .setState({
                    a: 0x34,
                    y: 0xFF,
                    flags: 0xFF
                })
                .poke({
                    '0x0055': 0x56,
                    '0x0056': 0x34,
                    '0x3555': 0x34
                })
                .run()
                .assertCycles(6)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );
    });

    suite('CPX', function() {
        util.testImmediate(0xE0, 0x23, 2,
            {
                x: 0x33,
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            ', flags'
        );

        util.testDereferencingZeropage(0xE4, 0x33, 3,
            {
                x: 0x33,
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', flags'
        );

        util.testDereferencingAbsolute(0xEC, 0xFF, 4,
            {
                x: 0xFE,
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', flags'
        );
    });

    suite('CPY', function() {
        util.testImmediate(0xC0, 0x23, 2,
            {
                y: 0x33,
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            ', flags'
        );

        util.testDereferencingZeropage(0xC4, 0x33, 3,
            {
                y: 0x33,
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', flags'
        );

        util.testDereferencingAbsolute(0xCC, 0xFF, 4,
            {
                y: 0xFE,
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', flags'
        );
    });

    suite('DEC', function() {
        util.testMutatingZeropage(0xC6, 0xFF, 0xFE, 5,
            {
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.e
            }
        );

        util.testMutatingZeropageX(0xD6, 0x00, 0xFF, 6,
            {
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.n | CpuInterface.Flags.e
            }
        );

        util.testMutatingAbsolute(0xCE, 0x01, 0x00, 6,
            {
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            }
        );

        util.testMutatingAbsoluteX(0xDE, 0x05, 0x04, 7, 7, {}, {});
    });

    suite('DEX', function() {
        test('starting with 0x01, flags', () => Runner
                .create([0xCA])
                .setState({
                    x: 0x01,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n,
                    x: 0
                })
        );

        test('starting with 0x00, flags', () => Runner
                .create([0xCA])
                .setState({
                    x: 0,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.z,
                    x: 0xFF
                })
        );
    });

    suite('DEY', function() {
        test('starting with 0x01, flags', () => Runner
                .create([0x88])
                .setState({
                    y: 0x01,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n,
                    y: 0
                })
        );

        test('starting with 0x00, flags', () => Runner
                .create([0x88])
                .setState({
                    y: 0,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.z,
                    y: 0xFF
                })
        );
    });

    suite('EOR', function() {
        util.testImmediate(0x49, 0x3, 2, {a: 0x01}, {a: 0x02}, ', flags');
        util.testDereferencingZeropage(0x45, 0xFF, 3,
            {
                a: 0x7F,
                flags: CpuInterface.Flags.e
            }, {
                a: 0x80,
                flags: CpuInterface.Flags.n | CpuInterface.Flags.e
            },
            ', flags'
        );
        util.testDereferencingZeropageX(0x55, 0xFF, 4,
            {
                a: 0xFF,
                flags: CpuInterface.Flags.e
            }, {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', flags'
        );
        util.testDereferencingAbsolute(0x4D, 0x3, 4, {a: 0x01}, {a: 0x02});
        util.testDereferencingAbsoluteX(0x5D, 0x3, 4, 5, {a: 0x01}, {a: 0x02});
        util.testDereferencingAbsoluteY(0x59, 0x3, 4, 5, {a: 0x01}, {a: 0x02});
        util.testDereferencingIndirectX(0x41, 0x3, 6, {a: 0x01}, {a: 0x02});
        util.testDereferencingIndirectY(0x51, 0x3, 5, 6, {a: 0x01}, {a: 0x02});
    });

    suite('INC', function() {
        util.testMutatingZeropage(0xE6, 0x11, 0x12, 5, {}, {}, ', 0x11');
        util.testMutatingZeropageX(0xF6, 0xEF, 0xF0, 6, {flags: 0}, {flags: CpuInterface.Flags.n},
            ', 0xEF, flags');
        util.testMutatingAbsolute(0xEE, 0xFF, 0x00, 6, {flags: 0}, {flags: CpuInterface.Flags.z},
            ', 0xFF, flags');
        util.testMutatingAbsoluteX(0xFE, 0x11, 0x12, 7, 7, {}, {}, ', 0x11');
    });

    suite('INY', function() {
        test('starting with 0xFF, flags', () => Runner
                .create([0xC8])
                .setState({
                    y: 0xFF,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.n,
                    y: 0
                })
        );

        test('starting with 0x7E, flags', () => Runner
                .create([0xC8])
                .setState({
                    y: 0x7F,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~CpuInterface.Flags.z,
                    y: 0x80
                })
        );
    });

    suite('INX', function() {
        util.testImplied(0xE8, 2,
            {
                x: 0xFF,
                flags: CpuInterface.Flags.e
            }, {
                x: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', 0xFF, flags'
        );

        util.testImplied(0xE8, 2,
            {
                x: 0xEF,
                flags: CpuInterface.Flags.e
            }, {
                x: 0xF0,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0xFF, flags'
        );

    });

    suite('JMP', function() {
        test('absolute', () => Runner
                .create([0x4C, 0x67, 0xA1])
                .run()
                .assertCycles(3)
                .assertState({
                    p: 0xA167
                })
        );

        test('indirect', () => Runner
                .create([0x6C, 0x67, 0xA1])
                .poke({
                    '0xA167': 0x34,
                    '0xA168': 0x56
                })
                .run()
                .assertCycles(5)
                .assertState({
                    p: 0x5634
                })
        );

        test('indirect, wraparound', () => Runner
                .create([0x6C, 0xFF, 0xA1])
                .poke({
                    '0xA1FF': 0x34,
                    '0xA100': 0x56
                })
                .run()
                .assertCycles(5)
                .assertState({
                    p: 0x5634
                })
        );

    });

    suite('JSR', function() {
        test('implied', () => Runner
                .create([0x20, 0x67, 0xA1], 0xE000)
                .setState({
                    s: 0xFF
                })
                .run()
                .assertCycles(6)
                .assertState({
                    p: 0xA167,
                    s: 0xFD
                })
                .assertMemory({
                    '0x01FE': 0x02,
                    '0x01FF': 0xE0
                })
        );

        test('stack overflow', () => Runner
                .create([0x20, 0x67, 0xA1], 0xE000)
                .setState({
                    s: 0x00
                })
                .run()
                .assertCycles(6)
                .assertState({
                    p: 0xA167,
                    s: 0xFE
                })
                .assertMemory({
                    '0x01FF': 0x02,
                    '0x0100': 0xE0
                })
        );
    });

    suite('LDA', function() {
        test('immediate, 0x00, flags', () => Runner
                .create([0xA9, 0])
                .setState({
                    a: 0x10,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('zeroPage, 0xFF, flags', () => Runner
                .create([0xA5, 0x12])
                .poke({
                    '0x12': 0xFF
                })
                .setState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(3)
                .assertState({
                    a: 0xFF,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
        );

        test('zeroPage,X , wraparound, 0x34, flags', () => Runner
                .create([0xB5, 0x12])
                .setState({
                    x: 0xFE,
                    flags: 0xFF
                })
                .poke({
                    '0x10': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x34,
                    flags: 0xFF & ~CpuInterface.Flags.z & ~CpuInterface.Flags.n
                })
        );

        test('absolute', () => Runner
                .create([0xAD, 0x12, 0x44])
                .poke({
                    '0x4412': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x34
                })
        );

        test('absolute,X', () => Runner
                .create([0xBD, 0x12, 0x44])
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
                })
        );

        test('absolute,X , page crossing', () => Runner
                .create([0xBD, 0xFF, 0xFF])
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
                })
        );

        test('absolute,Y', () => Runner
                .create([0xB9, 0x12, 0x44])
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
                })
        );

        test('absolute,Y , page crossing', () => Runner
                .create([0xB9, 0xFF, 0xFF])
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
                })
        );

        test('indirect,X , wraparound during sum', () => Runner
                .create([0xA1, 0x32])
                .setState({
                    x: 0xFE
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
                })
        );

        test('indirect,Y , wraparound during address read', () => Runner
                .create([0xB1, 0xFF])
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
                })
        );

        test('indirect,Y , page crossing', () => Runner
                .create([0xB1, 0xFE])
                .setState({
                    y: 0xFF
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
                })
        );
    });

    suite('LDX', function() {
        test('immediate, 0x00, flags', () => Runner
                .create([0xA2, 0x00])
                .setState({
                    x: 0x10,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    x: 0,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('zeroPage, 0xFF, flags', () => Runner
                .create([0xA6, 0x10])
                .poke({
                    '0x0010': 0xFF
                })
                .setState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(3)
                .assertState({
                    x: 0xFF,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
        );

        test('zeroPage,Y , wraparound, 0x23, flags', () => Runner
                .create([0xB6, 0x12])
                .poke({
                    '0x0011': 0x23
                })
                .setState({
                    y: 0xFF,
                    flags: 0xFF
                })
                .run()
                .assertCycles(4)
                .assertState({
                    x: 0x23,
                    flags: 0xFF & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
                })
        );

        test('absolute', () => Runner
                .create([0xAE, 0x11, 0xAE])
                .poke({
                    '0xAE11': 0x23
                })
                .run()
                .assertCycles(4)
                .assertState({
                    x: 0x23
                })
        );

        test('absolute,Y', () => Runner
                .create([0xBE, 0x10, 0xAE])
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
                })
        );

        test('absolute,Y , page crossing', () => Runner
                .create([0xBE, 0x02, 0xAE])
                .poke({
                    '0xAF01': 0x23
                })
                .setState({
                    y: 0xFF
                })
                .run()
                .assertCycles(5)
                .assertState({
                    x: 0x23
                })
        );
    });

    suite('LDY', function() {
        test('immediate, 0x00, flags', () => Runner
                .create([0xA0, 0x00])
                .setState({
                    y: 0x10,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    y: 0,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
        );

        test('zeroPage, 0xFF, flags', () => Runner
                .create([0xA4, 0x10])
                .poke({
                    '0x0010': 0xFF
                })
                .setState({
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(3)
                .assertState({
                    y: 0xFF,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
        );

        test('zeroPage,X , 0x23, flags', () => Runner
                .create([0xB4, 0x10])
                .poke({
                    '0x0011': 0x23
                })
                .setState({
                    x: 0x01,
                    flags: 0xFF
                })
                .run()
                .assertCycles(4)
                .assertState({
                    y: 0x23,
                    flags: 0xFF & ~CpuInterface.Flags.n & ~CpuInterface.Flags.z
                })
        );

        test('absolute', () => Runner
                .create([0xAC, 0x11, 0xAE])
                .poke({
                    '0xAE11': 0x23
                })
                .run()
                .assertCycles(4)
                .assertState({
                    y: 0x23
                })
        );

        test('absolute,X', () => Runner
                .create([0xBC, 0x10, 0xAE])
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
                })
        );

        test('absolute,X , page crossing', () => Runner
                .create([0xBC, 0x02, 0xAE])
                .poke({
                    '0xAF01': 0x23
                })
                .setState({
                    x: 0xFF
                })
                .run()
                .assertCycles(5)
                .assertState({
                    y: 0x23
                })
        );
    });

    suite('LSR', function() {
        util.testImplied(0x4A, 2,
            {
                a: 0x01,
                flags: CpuInterface.Flags.e
            }, {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01, flags'
        );

        util.testImplied(0x4A, 2,
            {
                a: 0x01,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01 + c, flags'
        );


        util.testImplied(0x4A, 2,
            {
                a: parseInt('10101010', 2)
            }, {
                a: parseInt('01010101', 2)
            },
            ', pattern, flags'
        );

        util.testMutatingZeropage(0x46, 0x01, 0x00, 5,
            {
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01, flags'
        );

        util.testMutatingZeropageX(0x56, 0x01, 0x00, 6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01 + c, flags'
        );


        util.testMutatingAbsolute(0x4E, parseInt('10101010', 2),  parseInt('01010101', 2), 6,
            {}, {}, ', pattern, flags'
        );

        util.testMutatingAbsolute(0x5E, parseInt('10101010', 2),  parseInt('01010101', 2), 7,
            {}, {}, ', pattern, flags'
        );
    });

    suite('NOP', function() {
        test('implied', () => Runner
                .create([0xEA])
                .run()
                .assertCycles(2)
                .assertState()
        );
    });

    suite('ORA', function() {
        util.testImmediate(0x09, 0x01, 2,
            {
                a: 0x80,
                flags: CpuInterface.Flags.e
            }, {
                a: 0x81,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            }
        );

        util.testDereferencingZeropage(0x05, 0x00, 3,
            {
                a: 0x00,
                flags: CpuInterface.Flags.e
            }, {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            }
        );

        util.testDereferencingZeropageX(0x15, 0x40, 4, {a: 0x04}, {a: 0x44});
        util.testDereferencingAbsolute(0x0D, 0x40, 4, {a: 0x04}, {a: 0x44});
        util.testDereferencingAbsoluteX(0x1D, 0x40, 4, 5, {a: 0x04}, {a: 0x44});
        util.testDereferencingAbsoluteY(0x19, 0x40, 4, 5, {a: 0x04}, {a: 0x44});
        util.testDereferencingIndirectX(0x01, 0x40, 6, {a: 0x04}, {a: 0x44});
        util.testDereferencingIndirectY(0x11, 0x40, 5, 6, {a: 0x04}, {a: 0x44});
    });

    suite('PHA', function() {
        test('implied', () => Runner
                .create([0x48])
                .setState({
                    a: 0xFF,
                    s: 0xFF
                })
                .run()
                .assertCycles(3)
                .assertState({
                    s: 0xFE
                })
                .assertMemory({
                    '0x01FF': 0xFF
                })
        );

        test('implied, stack overflow', () => Runner
                .create([0x48])
                .setState({
                    a: 0xE8,
                    s: 0x00
                })
                .run()
                .assertCycles(3)
                .assertState({
                    s: 0xFF
                })
                .assertMemory({
                    '0x0100': 0xE8
                })
        );
    });


    suite('PHP', function() {
        test('implied', () => Runner
                .create([0x08])
                .setState({
                    flags: 0xFF,
                    s: 0xFF
                })
                .run()
                .assertCycles(3)
                .assertState({
                    s: 0xFE
                })
                .assertMemory({
                    '0x01FF': 0xFF
                })
        );

        test('implied, stack overflow', () => Runner
                .create([0x08])
                .setState({
                    flags: 0xE8,
                    s: 0x00
                })
                .run()
                .assertCycles(3)
                .assertState({
                    s: 0xFF
                })
                .assertMemory({
                    '0x0100': 0xE8
                })
        );
    });

    suite('PLP', function() {
        test('implied', () => Runner
                .create([0x28])
                .setState({
                    flags: 0,
                    s: 0xFE
                })
                .poke({
                    '0x01FF': 0xFF
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0xFF,
                    flags: 0xFF & ~CpuInterface.Flags.e & ~CpuInterface.Flags.b
                })
        );

        test('implied, stack underflow', () => Runner
                .create([0x28])
                .setState({
                    flags: 0,
                    s: 0xFF
                })
                .poke({
                    '0x0100': 0xA7
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0x00,
                    flags: 0xA7 & ~CpuInterface.Flags.e & ~CpuInterface.Flags.b
                })
        );
    });

    suite('PLA', function() {
        test('implied', () => Runner
                .create([0x68])
                .setState({
                    a: 0,
                    s: 0xFE,
                    flags: CpuInterface.Flags.e
                })
                .poke({
                    '0x01FF': 0xFF
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0xFF,
                    a: 0xFF,
                    flags: CpuInterface.Flags.e | CpuInterface.Flags.n
                })
        );

        test('implied, stack underflow', () => Runner
                .create([0x68])
                .setState({
                    a: 0xFF,
                    s: 0xFF,
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
                })
        );
    });

    suite('ROL', function() {
        util.testImplied(0x2A, 2,
            {
                a: 0x80,
                flags: CpuInterface.Flags.e
            }, {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x80, flags'
        );

        util.testImplied(0x2A, 2,
            {
                a: 0x80,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                a: 0x01,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            ', 0x80 + c, flags'
        );

        util.testImplied(0x2A, 2,
            {
                a: 0x40,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                a: 0x81,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0x40 + c, flags'
        );

        util.testMutatingZeropage(0x26, 0x80, 0x00, 5,
            {
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x80, flags'
        );

        util.testMutatingZeropageX(0x36, 0x80, 0x01, 6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            },
            ', 0x80 + c, flags'
        );

        util.testMutatingAbsolute(0x2E, 0x40, 0x81, 6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0x40 + c, flags'
        );

        util.testMutatingAbsoluteX(0x3E, 0x01, 0x02, 7, 7, {}, {});
    });

    suite('ROR', function() {
        util.testImplied(0x6A, 2,
            {
                a: 0x01,
                flags: CpuInterface.Flags.e
            }, {
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01, flags'
        );

        util.testImplied(0x6A, 2,
            {
                a: 0x01,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                a: 0x80,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.n
            },
            ', 0x01 + c, flags'
        );

        util.testImplied(0x6A, 2,
            {
                a: 0x40,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                a: 0xA0,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0x40 + c, flags'
        );

        util.testMutatingZeropage(0x66, 0x01, 0x00, 5,
            {
                flags: CpuInterface.Flags.e
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.z
            },
            ', 0x01, flags'
        );

        util.testMutatingZeropageX(0x76, 0x01, 0x80, 6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c | CpuInterface.Flags.n
            },
            ', 0x01 + c, flags'
        );

        util.testMutatingAbsolute(0x6E, 0x40, 0xA0, 6,
            {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.c
            }, {
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0x40 + c, flags'
        );

        util.testMutatingAbsoluteX(0x7E, 0x02, 0x01, 7, 7, {}, {});
    });

    suite('RTI', function() {
        test('implied', () => Runner
                .create([0x40])
                .setState({
                    s: 0xFC,
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
                    s: 0xFF,
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.b
                })
        );

        test('implied, stack underflow', () => Runner
                .create([0x40])
                .setState({
                    s: 0xFE,
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
                    flags: CpuInterface.Flags.z | CpuInterface.Flags.b
                })
        );

    });

    suite('RTS', function() {
        test('implied', () => Runner
                .create([0x60])
                .setState({
                    s: 0xFD
                })
                .poke({
                    '0x01FE': 0xCC,
                    '0x01FF': 0xAB
                })
                .run()
                .assertCycles(6)
                .assertState({
                    s: 0xFF,
                    p: 0xABCD
                })
        );

        test('stack underflow', () => Runner
                .create([0x60])
                .setState({
                    s: 0xFE
                })
                .poke({
                    '0x01FF': 0xCC,
                    '0x0100': 0xAB
                })
                .run()
                .assertCycles(6)
                .assertState({
                    s: 0x00,
                    p: 0xABCD
                })
        );
    });

   suite('STA', function() {
        test('zeroPage , flags', () => Runner
                .create([0x85, 0x10])
                .setState({
                    a: 0x45,
                    flags: 0xFF
                })
                .run()
                .assertCycles(3)
                .assertState()
                .assertMemory({
                    '0x0010': 0x45
                })
        );

        test('zeroPage,X', () => Runner
                .create([0x95, 0x10])
                .setState({
                    a: 0x45,
                    x: 0x04
                })
                .run()
                .assertCycles(4)
                .assertState()
                .assertMemory({
                    '0x0014': 0x45
                })
        );

        test('absolute', () => Runner
                .create([0x8D, 0x10, 0x11])
                .setState({
                    a: 0x45
                })
                .run()
                .assertCycles(4)
                .assertState()
                .assertMemory({
                    '0x1110': 0x45
                })
        );

        test('absolute,X', () => Runner
                .create([0x9D, 0x10, 0x11])
                .setState({
                    a: 0x45,
                    x: 0x10
                })
                .run()
                .assertCycles(5)
                .assertState()
                .assertMemory({
                    '0x1120': 0x45
                })
        );

        test('absolute,X , page crossing', () => Runner
                .create([0x9D, 0x10, 0x11])
                .setState({
                    a: 0x45,
                    x: 0xFF
                })
                .run()
                .assertCycles(5)
                .assertState()
                .assertMemory({
                    '0x120F': 0x45
                })
        );

        test('absolute,Y', () => Runner
                .create([0x99, 0x10, 0x11])
                .setState({
                    a: 0x45,
                    y: 0x10
                })
                .run()
                .assertCycles(5)
                .assertState()
                .assertMemory({
                    '0x1120': 0x45
                })
        );

        test('absolute,Y , page crossing', () => Runner
                .create([0x99, 0x10, 0x11])
                .setState({
                    a: 0x45,
                    y: 0xFF
                })
                .run()
                .assertCycles(5)
                .assertState()
                .assertMemory({
                    '0x120F': 0x45
                })
        );

        test('indirect,X , wraparound during address read', () => Runner
                .create([0x81, 0xFE])
                .setState({
                    a: 0x45,
                    x: 0x01
                })
                .poke({
                    '0x00FF': 0x0F,
                    '0x0000': 0x12
                })
                .run()
                .assertCycles(6)
                .assertState()
                .assertMemory({
                    '0x120F': 0x45
                })
        );

        test('indirect,Y', () => Runner
                .create([0x91, 0x50])
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
                })
        );

        test('indirect,Y , page crossing', () => Runner
                .create([0x91, 0x50])
                .setState({
                    a: 0x45,
                    y: 0xFE
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
                })
        );
    });

    suite('STX', function() {
        test('zeroPage', () => Runner
                .create([0x86, 0x45])
                .setState({
                    x: 0x24
                })
                .run()
                .assertCycles(3)
                .assertMemory({
                    '0x0045': 0x24
                })
        );

        test('zeroPage,Y', () => Runner
                .create([0x96, 0x45])
                .setState({
                    x: 0x24,
                    y: 0x01
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x0046': 0x24
                })
        );

        test('absolute', () => Runner
                .create([0x8E, 0x45, 0x73])
                .setState({
                    x: 0x24
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x7345': 0x24
                })
        );
    });

    suite('STY', function() {
        test('zeroPage', () => Runner
                .create([0x84, 0x45])
                .setState({
                    y: 0x24
                })
                .run()
                .assertCycles(3)
                .assertMemory({
                    '0x0045': 0x24
                })
        );

        test('zeroPage,X', () => Runner
                .create([0x94, 0x45])
                .setState({
                    y: 0x24,
                    x: 0x01
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x0046': 0x24
                })
        );

        test('absolute', () => Runner
                .create([0x8C, 0x45, 0x73])
                .setState({
                    y: 0x24
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x7345': 0x24
                })
        );
    });

    suite('TAX', function() {
        util.testImplied(0xAA, 2,
            {
                a: 0xFF,
                x: 0,
                flags: CpuInterface.Flags.e
            }, {
                x: 0xFF,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0xFF, flags'
        );

        util.testImplied(0xAA, 2,
            {
                a: 0x00,
                x: 0xFF,
                flags: CpuInterface.Flags.e
            }, {
                x: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', 0x00, flags'
        );
    });

    suite('TAY', function() {
        util.testImplied(0xA8, 2,
            {
                a: 0xFF,
                y: 0,
                flags: CpuInterface.Flags.e
            }, {
                y: 0xFF,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0xFF, flags'
        );

        util.testImplied(0xA8, 2,
            {
                a: 0x00,
                y: 0xFF,
                flags: CpuInterface.Flags.e
            }, {
                y: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', 0x00, flags'
        );
    });

    suite('TSX', function() {
        util.testImplied(0xBA, 2,
            {
                s: 0x45,
                x: 0x00,
                flags: 0xFF
            }, {
                x:0x45,
                flags: 0xFF & ~CpuInterface.Flags.z & ~CpuInterface.Flags.n
            }
        );
    });

    suite('TXA', function() {
        util.testImplied(0x8A, 2,
            {
                x: 0x11,
                a: 0x00
            }, {
                x: 0x11,
                a: 0x11
            },
            ', 0x11'
        );

        util.testImplied(0x8A, 2,
            {
                x: 0xFF,
                a: 0x00,
                flags: CpuInterface.Flags.e
            }, {
                x: 0xFF,
                a: 0xFF,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.n
            },
            ', 0xFF'
        );

        util.testImplied(0x8A, 2,
            {
                x: 0x00,
                a: 0xFF,
                flags: CpuInterface.Flags.e
            }, {
                x: 0x00,
                a: 0x00,
                flags: CpuInterface.Flags.e | CpuInterface.Flags.z
            },
            ', 0x00'
        );
    });

    suite('TXS', function() {
        test('implied, flags', () => Runner
                .create([0x9A])
                .setState({
                    x: 0xDE,
                    s: 0x00,
                    flags: 0xFF
                })
                .run()
                .assertCycles(2)
                .assertState({
                    s: 0xDE
                })
        );
    });

    suite('TYA', function() {
        test('implied, flags', () => Runner
                .create([0x98])
                .setState({
                    y: 0xFF,
                    a: 0,
                    flags: 0xFF & ~CpuInterface.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0xFF,
                    flags: 0xFF & ~CpuInterface.Flags.z
                })
        );
    });

}