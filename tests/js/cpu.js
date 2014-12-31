var cpuRunner = require('./runner/cpu'),
    Cpu = require('../../src/cpu/Cpu'),
    hex = require('../../src/tools/hex'),
    util = require('util');

function branchSuite(mnemonic, opcode, jumpCondition, noJumpCondition) {
    suite(mnemonic, function() {
        test('immediate, no branch', function() {
            cpuRunner
                .create([opcode, 0x0F], 0xE000)
                .setState({
                    flags: noJumpCondition
                })
                .run()
                .assertCycles(2)
                .assertState({
                    p: 0xE000 + 2
                });
        });

        test('immediate, forward branch', function() {
            cpuRunner
                .create([opcode, 0x0F], 0xE000)
                .setState({
                    flags: jumpCondition
                })
                .run()
                .assertCycles(3)
                .assertState({
                    p: 0xE000 + 2 + 0x0F
                });
        });

        test('immediate, backward branch, page crossing', function() {
            cpuRunner
                .create([opcode, (~0x0A & 0xFF) + 1], 0xE000)
                .setState({
                    flags: jumpCondition
                })
                .run()
                .assertCycles(4)
                .assertState({
                    p: 0xE000 + 2 - 0x0A
                });
        });

    });

}

function clearFlagSuite(mnemonic, opcode, flag) {
    suite(mnemonic, function() {
        test('implied', function() {
            cpuRunner
                .create([opcode])
                .setState({
                    flags: Cpu.Flags.e | flag
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: Cpu.Flags.e
                });
        });
    });
}

function setFlagSuite(mnemonic, opcode, flag) {
    suite(mnemonic, function() {
        test('implied', function() {
            cpuRunner
                .create([opcode])
                .setState({
                    flags: Cpu.Flags.e
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: Cpu.Flags.e | flag
                });
        });
    });
}

function testAdc(in1, in2, out, flags, flagsDontcare, carry) {
    if (typeof(flagsDontcare) === 'undefined') flagsDontcare = 0;

    test(util.format('immediate, %s + %s%s = %s',
        hex.encode(in1, 2), hex.encode(in2, 2), carry ? ' + c' : '', hex.encode(out, 2)), function()
    {
        var runner = cpuRunner
            .create([0x69, in1])
            .setState({
                a: in2,
                flags: Cpu.Flags.e | (carry ? Cpu.Flags.c : 0)
            });

        runner
            .run()
            .assertCycles(2)
            .assertState({
                a: out,
                flags: ((Cpu.Flags.e | flags) & ~flagsDontcare) |
                    (runner.getCpu().state.flags & flagsDontcare)
            });
    });
}

function testAdcNeg(in1, in2, out, flags, flagsDontcare, carry) {
    if (typeof(flagsDontcare) === 'undefined') flagsDontcare = 0;

    test(util.format('immediate, %s + %s%s = %s',
        hex.encode(in1, 2), hex.encode(in2, 2), carry ? ' + c' : '', hex.encode(out, 2)), function()
    {
        in1 = in1 >= 0 ? in1 : (~Math.abs(in1) & 0xFF) + 1;
        in2 = in2 >= 0 ? in2 : (~Math.abs(in2) & 0xFF) + 1;
        out = out >= 0 ? out : (~Math.abs(out) & 0xFF) + 1;

        var runner = cpuRunner
            .create([0x69, in1])
            .setState({
                a: in2,
                flags: Cpu.Flags.e | (carry ? Cpu.Flags.c : 0)
            })
            .run();

        runner
            .assertCycles(2)
            .assertState({
                a: out,
                flags: ((Cpu.Flags.e | flags) & ~flagsDontcare) |
                    (runner.getCpu().state.flags & flagsDontcare)
            });
    });
}

function testAdcBcd(in1, in2, out, flags, flagsDontcare, carry) {
    if (typeof(flagsDontcare) === 'undefined') flagsDontcare = 0;

    test(util.format('immediate BCD, %s + %s%s = %s',
        hex.encode(in1, 2), hex.encode(in2, 2), carry ? ' + c' : '', hex.encode(out, 2)), function()
    {
        var runner = cpuRunner
            .create([0x69, in1])
            .setState({
                a: in2,
                flags: Cpu.Flags.d | (carry ? Cpu.Flags.c : 0)
            });

        runner
            .run()
            .assertCycles(2)
            .assertState({
                a: out,
                flags: ((Cpu.Flags.d | flags) & ~flagsDontcare) |
                    (runner.getCpu().state.flags & (flagsDontcare | Cpu.Flags.v))
            });
    });
}

function testSbc(in1, in2, out, flags, flagsDontcare, borrow) {
    if (typeof(flagsDontcare) === 'undefined') flagsDontcare = 0;

    test(util.format('immediate, %s - %s%s = %s',
        hex.encode(in1, 2), hex.encode(in2, 2), borrow ? ' - b' : '', hex.encode(out, 2)), function()
    {
        var runner = cpuRunner
            .create([0xE9, in2])
            .setState({
                a: in1,
                flags: Cpu.Flags.e | (borrow ? 0 : Cpu.Flags.c)
            });

        runner
            .run()
            .assertCycles(2)
            .assertState({
                a: out,
                flags: ((Cpu.Flags.e | flags) & ~flagsDontcare) |
                    (runner.getCpu().state.flags & (flagsDontcare | Cpu.Flags.v))
            });
    });
}

function testSbcBcd(in1, in2, out, flags, flagsDontcare, borrow) {
    if (typeof(flagsDontcare) === 'undefined') flagsDontcare = 0;

    test(util.format('immediate, BCD %s - %s%s = %s',
        hex.encode(in1, 2), hex.encode(in2, 2), borrow ? ' - b' : '', hex.encode(out, 2)), function()
    {
        var runner = cpuRunner
            .create([0xE9, in2])
            .setState({
                a: in1,
                flags: Cpu.Flags.d | (borrow ? 0 : Cpu.Flags.c)
            });

        runner
            .run()
            .assertCycles(2)
            .assertState({
                a: out,
                flags: ((Cpu.Flags.d | flags) & ~flagsDontcare) |
                    (runner.getCpu().state.flags & (flagsDontcare | Cpu.Flags.v))
            });
    });
}

function testImplied(
    opcode, cycles, stateBefore, stateAfter, extra
) {
    test('implied' + (extra || ''), function() {
        cpuRunner
            .create([opcode])
            .setState(stateBefore)
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter);
    });
}

function testImmediate(
    opcode, operand, cycles, stateBefore, stateAfter, extra
) {
    test('immediate' + (extra || ''), function() {
        cpuRunner
            .create([opcode, operand])
            .setState(stateBefore)
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter);
    });
}

function testDereferencingZeropage(
    opcode, operand, cycles, stateBefore, stateAfter, extra
) {
    test('zeroPage' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34])
            .setState(stateBefore)
            .poke({
                '0x0034': operand
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter);
    });
}

function testDereferencingZeropageX(
    opcode, operand, cycles, stateBefore, stateAfter, extra
) {
    stateBefore.x = 0x12;

    test('zeroPage,X' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34])
            .setState(stateBefore)
            .poke({
                '0x0046': operand
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter);
    });
}

function testDereferencingAbsolute(
    opcode, operand, cycles, stateBefore, stateAfter, extra
) {
    test('absolute' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34, 0x56])
            .setState(stateBefore)
            .poke({
                '0x5634': operand
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter);
    });
}

function testDereferencingAbsoluteX(
    opcode, operand, cycles, cyclesCross, stateBefore, stateAfter, extra
) {
    stateBefore.x = 0x12;

    test('absolute,X' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34, 0x55])
            .setState(stateBefore)
            .poke({
                '0x5546': operand
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter);
    });

    test('absolute,X , page crossing' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0xEE, 0x55])
            .setState(stateBefore)
            .poke({
                '0x5600': operand
            })
            .run()
            .assertCycles(cyclesCross)
            .assertState(stateAfter);
    });
}

function testDereferencingAbsoluteY(
    opcode, operand, cycles, cyclesCross, stateBefore, stateAfter, extra
) {
    stateBefore.y = 0x12;

    test('absolute,Y' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34, 0x55])
            .setState(stateBefore)
            .poke({
                '0x5546': operand
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter);
    });

    test('absolute,Y , page crossing' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0xEE, 0x55])
            .setState(stateBefore)
            .poke({
                '0x5600': operand
            })
            .run()
            .assertCycles(cyclesCross)
            .assertState(stateAfter);
    });
}

function testDereferencingIndirectX(
    opcode, operand, cycles, stateBefore, stateAfter, extra
) {
    stateBefore.x = 0x12;

    test('indirect,X' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34])
            .setState(stateBefore)
            .poke({
                '0x0046': 0x87,
                '0x0047': 0x6E,
                '0x6E87': operand
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter);
    });
}

function testDereferencingIndirectY(
    opcode, operand, cycles, cyclesCross, stateBefore, stateAfter, extra
) {
    stateBefore.y = 0x12;

    test('indirect,Y' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34])
            .setState(stateBefore)
            .poke({
                '0x0034': 0x87,
                '0x0035': 0x6E,
                '0x6E99': operand
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter);
    });

    test('indirect,Y , page crossing' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34])
            .setState(stateBefore)
            .poke({
                '0x0034': 0xFF,
                '0x0035': 0x6E,
                '0x6F11': operand
            })
            .run()
            .assertCycles(cyclesCross)
            .assertState(stateAfter);
    });

}

function testMutatingZeropage(
    opcode, before, after, cycles, stateBefore, stateAfter, extra
) {
    test('zeroPage' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34])
            .setState(stateBefore)
            .poke({
                '0x0034': before
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter)
            .assertMemory({
                '0x0034': after
            });
    });
}

function testMutatingZeropageX(
    opcode, before, after, cycles, stateBefore, stateAfter, extra
) {
    stateBefore.x = 0x12;

    test('zeroPage,X' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34])
            .setState(stateBefore)
            .poke({
                '0x0046': before
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter)
            .assertMemory({
                '0x0046': after
            });
    });
}

function testMutatingAbsolute(
    opcode, before, after, cycles, stateBefore, stateAfter, extra
) {
    test('absolute' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34, 0x56])
            .setState(stateBefore)
            .poke({
                '0x5634': before
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter)
            .assertMemory({
                '0x5634': after
            });
    });
}

function testMutatingAbsoluteX(
    opcode, before, after, cycles, cyclesCross, stateBefore, stateAfter, extra
) {
    stateBefore.x = 0x12;

    test('absolute,X' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0x34, 0x55])
            .setState(stateBefore)
            .poke({
                '0x5546': before
            })
            .run()
            .assertCycles(cycles)
            .assertState(stateAfter)
            .assertMemory({
                '0x5546': after
            });
    });

    test('absolute,X , page crossing' + (extra || ''), function() {
        cpuRunner
            .create([opcode, 0xEE, 0x55])
            .setState(stateBefore)
            .poke({
                '0x5600': before
            })
            .run()
            .assertCycles(cyclesCross)
            .assertState(stateAfter)
            .assertMemory({
                '0x5600': after
            });
    });
}

suite('CPU', function() {

    suite('ASL', function() {
        testImplied(0x0A, 2,
            {
                a: 0xFF,
                flags: Cpu.Flags.e
            }, {
                a: 0xFE,
                flags: Cpu.Flags.e | Cpu.Flags.n  | Cpu.Flags.c
            },
            ', 0xFF'
        );

        testImplied(0x0A, 2,
            {
                a: parseInt('01010101', 2),
                flags: Cpu.Flags.e
            }, {
                a: parseInt('10101010', 2),
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', pattern'
        );

        testImplied(0x0A, 2,
            {
                a: 0x80,
                flags: Cpu.Flags.e
            }, {
                a: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.z | Cpu.Flags.c
            },
            ', 0x01'
        );

        testMutatingZeropage(0x06, 0xFF, 0xFE, 5,
            {
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.n  | Cpu.Flags.c
            },
            ', 0xFF'
        );

        testMutatingZeropage(0x06, parseInt('01010101', 2), parseInt('10101010', 2), 5,
            {
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', pattern'
        );

        testMutatingZeropage(0x06, 0x80, 0x00, 5,
            {
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.z | Cpu.Flags.c
            },
            ', 0x01'
        );

        testMutatingZeropageX(0x16, 0x01, 0x02, 6, {a: 0x02}, {});
        testMutatingAbsolute(0x0E, 0x01, 0x02, 6, {a: 0x02}, {});
        testMutatingAbsoluteX(0x1E, 0x01, 0x02, 7, 7, {a: 0x02}, {});

    });

    suite('ADC', function() {
        testAdc(0x01, 0x30, 0x31, 0, Cpu.Flags.v);
        testAdc(0x01, 0x30, 0x32, 0, Cpu.Flags.v, true);
        testAdc(0xFE, 0x02, 0x00, Cpu.Flags.c | Cpu.Flags.z, Cpu.Flags.v);
        testAdc(0x80, 0x70, 0xF0, Cpu.Flags.n);
        testAdcNeg(0x01, -0x01, 0x00, Cpu.Flags.z, Cpu.Flags.c);
        testAdcNeg(-0x71, 0x61, -0x10, Cpu.Flags.n, Cpu.Flags.c);
        testAdcNeg(-0x71, -0x61, 0x2E, Cpu.Flags.v, Cpu.Flags.c);
        testAdcNeg(0x7F, 0x7F, 0xFE, Cpu.Flags.v | Cpu.Flags.n, Cpu.Flags.c);
        testAdcBcd(0x03, 0x08, 0x11);
        testAdcBcd(0x23, 0x44, 0x67);
        testAdcBcd(0x76, 0x43, 0x19, Cpu.Flags.c);
        testAdcBcd(0x77, 0x23, 0x00, Cpu.Flags.z | Cpu.Flags.c);
        testAdcBcd(0x50, 0x44, 0x94, Cpu.Flags.n);

        testDereferencingZeropage(0x65, 0x12, 3, {a: 0x23}, {a: 0x35});
        testDereferencingZeropageX(0x75, 0x12, 4, {a: 0x23}, {a: 0x35});
        testDereferencingAbsolute(0x6D, 0x12, 4, {a: 0x23}, {a: 0x35});
        testDereferencingAbsoluteX(0x7D, 0x12, 4, 5, {a: 0x23}, {a: 0x35});
        testDereferencingAbsoluteY(0x79, 0x12, 4, 5, {a: 0x23}, {a: 0x35});
        testDereferencingIndirectX(0x61, 0x12, 6, {a: 0x23}, {a: 0x35});
        testDereferencingIndirectY(0x71, 0x12, 5, 6, {a: 0x23}, {a: 0x35});

    });

    suite('AND', function() {
        test('immediate, flags', function() {
            cpuRunner
                .create([0x29, 0xFF])
                .setState({
                    a: 0xF0,
                    flags: 0xFF & ~Cpu.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0xF0,
                    flags: 0xFF & ~Cpu.Flags.z
                });
        });

        test('zeroPage, flags', function() {
            cpuRunner
                .create([0x25, 0x34])
                .setState({
                    a: 0x0F,
                    flags: 0xFF & ~Cpu.Flags.z
                })
                .poke({
                    '0x0034': 0xF0
                })
                .run()
                .assertCycles(3)
                .assertState({
                    a: 0x00,
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('zeroPage,X, flags', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n & ~Cpu.Flags.z
                });
        });

        test('absolute', function() {
            cpuRunner
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
                });
        });

        test('absolute,X', function() {
            cpuRunner
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
                });
        });

        test('absolute,X , page crossing', function() {
            cpuRunner
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
                });
        });

        test('absolute,Y', function() {
            cpuRunner
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
                });
        });

        test('absolute,Y , page crossing', function() {
            cpuRunner
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
                });
        });

        test('indirect.X', function() {
            cpuRunner
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
                });
        });

        test('indirect,Y', function() {
            cpuRunner
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
                });
        });

        test('indirect,Y , page crossing', function() {
            cpuRunner
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
                });
        });

    });

    branchSuite('BCC', 0x90, 0, Cpu.Flags.c);

    suite('BIT', function() {
        testDereferencingZeropage(0x24, Cpu.Flags.n, 3,
            {
                flags: Cpu.Flags.e,
                a: 0
            }, {
                flags: Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.e
            },
            ', n'
        );

        testDereferencingAbsolute(0x2C, Cpu.Flags.n | Cpu.Flags.v, 4,
            {
                flags: Cpu.Flags.e,
                a: 0
            }, {
                flags: Cpu.Flags.n | Cpu.Flags.z | Cpu.Flags.e | Cpu.Flags.v
            },
            ', n | v'
        );

        testDereferencingAbsolute(0x2C, Cpu.Flags.n | Cpu.Flags.v, 4,
            {
                flags: Cpu.Flags.e,
                a: 0xFF
            }, {
                flags: Cpu.Flags.n | Cpu.Flags.e | Cpu.Flags.v
            },
            ', n | v, a = 0xFF'
        );

        testDereferencingAbsolute(0x2C, 0x01, 4,
            {
                flags: Cpu.Flags.e,
                a: 0x01
            }, {
                flags: Cpu.Flags.e
            },
            ', 0x01, a = 0xFF'
        );
    });

    branchSuite('BNE', 0xD0, 0, Cpu.Flags.z);

    branchSuite('BEQ', 0xF0, Cpu.Flags.z, 0);

    branchSuite('BPL', 0x10, 0, Cpu.Flags.n);

    branchSuite('BMI', 0x30, Cpu.Flags.n, 0);

    branchSuite('BVC', 0x50, 0, Cpu.Flags.v);

    branchSuite('BVS', 0x70, Cpu.Flags.v, 0);

    clearFlagSuite('CLC', 0x18, Cpu.Flags.c);

    clearFlagSuite('CLD', 0xD8, Cpu.Flags.d);

    clearFlagSuite('CLI', 0x58, Cpu.Flags.i);

    clearFlagSuite('CLV', 0xB8, Cpu.Flags.v);

    suite('CMP', function() {
        test('immediate, flags', function() {
            cpuRunner
                .create([0xC9, 0xFF])
                .setState({
                    a: 0,
                    flags: 0xFF
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~Cpu.Flags.c &~ Cpu.Flags.n &~ Cpu.Flags.z
                });
        });

        test('zero page, flags', function() {
            cpuRunner
                .create([0xC5, 0x55])
                .setState({
                    a: 0xFF,
                    flags: 0xFF & ~Cpu.Flags.c & ~Cpu.Flags.n
                })
                .poke({
                    '0x0055': 0x00
                })
                .run()
                .assertCycles(3)
                .assertState({
                    flags: 0xFF & ~Cpu.Flags.z
                });
        });

        test('zero page,X, flags', function() {
            cpuRunner
                .create([0xD5, 0x55])
                .setState({
                    a: 0x34,
                    x: 0x01,
                    flags: 0xFF & ~Cpu.Flags.c & ~Cpu.Flags.z
                })
                .poke({
                    '0x0056': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('absolute', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('absolute,X', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('absolute,X , page crossing', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('absolute,Y', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('absolute,Y , page crossing', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('indirect,X', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('indirect,Y', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('indirect,Y , page crossing', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });
    });

    suite('CPX', function() {
        testImmediate(0xE0, 0x23, 2,
            {
                x: 0x33,
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c
            },
            ', flags'
        );

        testDereferencingZeropage(0xE4, 0x33, 3,
            {
                x: 0x33,
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', flags'
        );

        testDereferencingAbsolute(0xEC, 0xFF, 4,
            {
                x: 0xFE,
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', flags'
        );
    });

    suite('CPY', function() {
        testImmediate(0xC0, 0x23, 2,
            {
                y: 0x33,
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c
            },
            ', flags'
        );

        testDereferencingZeropage(0xC4, 0x33, 3,
            {
                y: 0x33,
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', flags'
        );

        testDereferencingAbsolute(0xCC, 0xFF, 4,
            {
                y: 0xFE,
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', flags'
        );
    });

    suite('DEC', function() {
        testMutatingZeropage(0xC6, 0xFF, 0xFE, 5,
            {
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.n | Cpu.Flags.e
            }
        );

        testMutatingZeropageX(0xD6, 0x00, 0xFF, 6,
            {
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.n | Cpu.Flags.e
            }
        );

        testMutatingAbsolute(0xCE, 0x01, 0x00, 6,
            {
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.z
            }
        );

        testMutatingAbsoluteX(0xDE, 0x05, 0x04, 7, 7, {}, {});
    });

    suite('DEX', function() {
        test('starting with 0x01, flags', function() {
            cpuRunner
                .create([0xCA])
                .setState({
                    x: 0x01,
                    flags: 0xFF & ~Cpu.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~Cpu.Flags.n,
                    x: 0
                });
        });

        test('starting with 0x00, flags', function() {
            cpuRunner
                .create([0xCA])
                .setState({
                    x: 0,
                    flags: 0xFF & ~Cpu.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~Cpu.Flags.z,
                    x: 0xFF
                });
        });
    });

    suite('DEY', function() {
        test('starting with 0x01, flags', function() {
            cpuRunner
                .create([0x88])
                .setState({
                    y: 0x01,
                    flags: 0xFF & ~Cpu.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~Cpu.Flags.n,
                    y: 0
                });
        });

        test('starting with 0x00, flags', function() {
            cpuRunner
                .create([0x88])
                .setState({
                    y: 0,
                    flags: 0xFF & ~Cpu.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~Cpu.Flags.z,
                    y: 0xFF
                });
        });
    });

    suite('EOR', function() {
        testImmediate(0x49, 0x3, 2, {a: 0x01}, {a: 0x02}, ', flags');
        testDereferencingZeropage(0x45, 0xFF, 3,
            {
                a: 0x7F,
                flags: Cpu.Flags.e
            }, {
                a: 0x80,
                flags: Cpu.Flags.n | Cpu.Flags.e
            },
            ', flags'
        );
        testDereferencingZeropageX(0x55, 0xFF, 4,
            {
                a: 0xFF,
                flags: Cpu.Flags.e
            }, {
                a: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.z
            },
            ', flags'
        );
        testDereferencingAbsolute(0x4D, 0x3, 4, {a: 0x01}, {a: 0x02});
        testDereferencingAbsoluteX(0x5D, 0x3, 4, 5, {a: 0x01}, {a: 0x02});
        testDereferencingAbsoluteY(0x59, 0x3, 4, 5, {a: 0x01}, {a: 0x02});
        testDereferencingIndirectX(0x41, 0x3, 6, {a: 0x01}, {a: 0x02});
        testDereferencingIndirectY(0x51, 0x3, 5, 6, {a: 0x01}, {a: 0x02});
    });

    suite('INC', function() {
        testMutatingZeropage(0xE6, 0x11, 0x12, 5, {}, {}, ', 0x11');
        testMutatingZeropageX(0xF6, 0xEF, 0xF0, 6, {flags: 0}, {flags: Cpu.Flags.n},
            ', 0xEF, flags');
        testMutatingAbsolute(0xEE, 0xFF, 0x00, 6, {flags: 0}, {flags: Cpu.Flags.z},
            ', 0xFF, flags');
        testMutatingAbsoluteX(0xFE, 0x11, 0x12, 7, 7, {}, {}, ', 0x11');
    });

    suite('INY', function() {
        test('starting with 0xFF, flags', function() {
            cpuRunner
                .create([0xC8])
                .setState({
                    y: 0xFF,
                    flags: 0xFF & ~Cpu.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~Cpu.Flags.n,
                    y: 0
                });
        });

        test('starting with 0x7E, flags', function() {
            cpuRunner
                .create([0xC8])
                .setState({
                    y: 0x7F,
                    flags: 0xFF & ~Cpu.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0xFF & ~Cpu.Flags.z,
                    y: 0x80
                });
        });
    });

    suite('INX', function() {
        testImplied(0xE8, 2,
            {
                x: 0xFF,
                flags: Cpu.Flags.e
            }, {
                x: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.z
            },
            ', 0xFF, flags'
        );

        testImplied(0xE8, 2,
            {
                x: 0xEF,
                flags: Cpu.Flags.e
            }, {
                x: 0xF0,
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', 0xFF, flags'
        );

    });

    suite('JMP', function() {
        test('absolute', function() {
            cpuRunner
                .create([0x4C, 0x67, 0xA1])
                .run()
                .assertCycles(3)
                .assertState({
                    p: 0xA167
                });
        });

        test('indirect', function() {
            cpuRunner
                .create([0x6C, 0x67, 0xA1])
                .poke({
                    '0xA167': 0x34,
                    '0xA168': 0x56
                })
                .run()
                .assertCycles(5)
                .assertState({
                    p: 0x5634
                });
        });

        test('indirect, wraparound', function() {
            cpuRunner
                .create([0x6C, 0xFF, 0xA1])
                .poke({
                    '0xA1FF': 0x34,
                    '0xA100': 0x56
                })
                .run()
                .assertCycles(5)
                .assertState({
                    p: 0x5634
                });
        });

    });

    suite('JSR', function() {
        test('implied', function() {
            cpuRunner
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
                });
        });

        test('stack overflow', function() {
            cpuRunner
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
                });
        });
    });

    suite('LDA', function() {
        test('immediate, 0x00, flags', function() {
            cpuRunner
                .create([0xA9, 0])
                .setState({
                    a: 0x10,
                    flags: 0xFF & ~Cpu.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0,
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('zeroPage, 0xFF, flags', function() {
            cpuRunner
                .create([0xA5, 0x12])
                .poke({
                    '0x12': 0xFF
                })
                .setState({
                    flags: 0xFF & ~Cpu.Flags.n
                })
                .run()
                .assertCycles(3)
                .assertState({
                    a: 0xFF,
                    flags: 0xFF & ~Cpu.Flags.z
                });
        });

        test('zeroPage,X , wraparound, 0x34, flags', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.z & ~Cpu.Flags.n
                });
        });

        test('absolute', function() {
            cpuRunner
                .create([0xAD, 0x12, 0x44])
                .poke({
                    '0x4412': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x34
                });
        });

        test('absolute,X', function() {
            cpuRunner
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
                });
        });

        test('absolute,X , page crossing', function() {
            cpuRunner
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
                });
        });

        test('absolute,Y', function() {
            cpuRunner
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
                });
        });

        test('absolute,Y , page crossing', function() {
            cpuRunner
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
                });
        });

        test('indirect,X , wraparound during sum', function() {
            cpuRunner
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
                });
        });

        test('indirect,Y , wraparound during address read', function() {
            cpuRunner
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
                });
        });

        test('indirect,Y , page crossing', function() {
            cpuRunner
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
                });
        });
    });

    suite('LDX', function() {
        test('immediate, 0x00, flags', function() {
            cpuRunner
                .create([0xA2, 0x00])
                .setState({
                    x: 0x10,
                    flags: 0xFF & ~Cpu.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    x: 0,
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('zeroPage, 0xFF, flags', function() {
            cpuRunner
                .create([0xA6, 0x10])
                .poke({
                    '0x0010': 0xFF
                })
                .setState({
                    flags: 0xFF & ~Cpu.Flags.n
                })
                .run()
                .assertCycles(3)
                .assertState({
                    x: 0xFF,
                    flags: 0xFF & ~Cpu.Flags.z
                });
        });

        test('zeroPage,Y , wraparound, 0x23, flags', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n & ~Cpu.Flags.z
                });
        });

        test('absolute', function() {
            cpuRunner
                .create([0xAE, 0x11, 0xAE])
                .poke({
                    '0xAE11': 0x23
                })
                .run()
                .assertCycles(4)
                .assertState({
                    x: 0x23
                });
        });

        test('absolute,Y', function() {
            cpuRunner
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
                });
        });

        test('absolute,Y , page crossing', function() {
            cpuRunner
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
                });
        });
    });

    suite('LDY', function() {
        test('immediate, 0x00, flags', function() {
            cpuRunner
                .create([0xA0, 0x00])
                .setState({
                    y: 0x10,
                    flags: 0xFF & ~Cpu.Flags.z
                })
                .run()
                .assertCycles(2)
                .assertState({
                    y: 0,
                    flags: 0xFF & ~Cpu.Flags.n
                });
        });

        test('zeroPage, 0xFF, flags', function() {
            cpuRunner
                .create([0xA4, 0x10])
                .poke({
                    '0x0010': 0xFF
                })
                .setState({
                    flags: 0xFF & ~Cpu.Flags.n
                })
                .run()
                .assertCycles(3)
                .assertState({
                    y: 0xFF,
                    flags: 0xFF & ~Cpu.Flags.z
                });
        });

        test('zeroPage,X , 0x23, flags', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.n & ~Cpu.Flags.z
                });
        });

        test('absolute', function() {
            cpuRunner
                .create([0xAC, 0x11, 0xAE])
                .poke({
                    '0xAE11': 0x23
                })
                .run()
                .assertCycles(4)
                .assertState({
                    y: 0x23
                });
        });

        test('absolute,X', function() {
            cpuRunner
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
                });
        });

        test('absolute,X , page crossing', function() {
            cpuRunner
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
                });
        });
    });

    suite('LSR', function() {
        testImplied(0x4A, 2,
            {
                a: 0x01,
                flags: Cpu.Flags.e
            }, {
                a: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', 0x01, flags'
        );

        testImplied(0x4A, 2,
            {
                a: 0x01,
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                a: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', 0x01 + c, flags'
        );


        testImplied(0x4A, 2,
            {
                a: parseInt('10101010', 2)
            }, {
                a: parseInt('01010101', 2)
            },
            ', pattern, flags'
        );

        testMutatingZeropage(0x46, 0x01, 0x00, 5,
            {
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', 0x01, flags'
        );

        testMutatingZeropageX(0x56, 0x01, 0x00, 6,
            {
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', 0x01 + c, flags'
        );


        testMutatingAbsolute(0x4E, parseInt('10101010', 2),  parseInt('01010101', 2), 6,
            ', pattern, flags'
        );

        testMutatingAbsolute(0x5E, parseInt('10101010', 2),  parseInt('01010101', 2), 7, 7,
            ', pattern, flags'
        );
    });

    suite('NOP', function() {
        test('implied', function() {
            cpuRunner
                .create([0xEA])
                .run()
                .assertCycles(2)
                .assertState();
        });
    });

    suite('ORA', function() {
        testImmediate(0x09, 0x01, 2,
            {
                a: 0x80,
                flags: Cpu.Flags.e
            }, {
                a: 0x81,
                flags: Cpu.Flags.e | Cpu.Flags.n
            }
        );

        testDereferencingZeropage(0x05, 0x00, 3,
            {
                a: 0x00,
                flags: Cpu.Flags.e
            }, {
                a: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.z
            }
        );

        testDereferencingZeropageX(0x15, 0x40, 4, {a: 0x04}, {a: 0x44});
        testDereferencingAbsolute(0x0D, 0x40, 4, {a: 0x04}, {a: 0x44});
        testDereferencingAbsoluteX(0x1D, 0x40, 4, 5, {a: 0x04}, {a: 0x44});
        testDereferencingAbsoluteY(0x19, 0x40, 4, 5, {a: 0x04}, {a: 0x44});
        testDereferencingIndirectX(0x01, 0x40, 6, {a: 0x04}, {a: 0x44});
        testDereferencingIndirectY(0x11, 0x40, 5, 6, {a: 0x04}, {a: 0x44});
    });

    suite('PHA', function() {
        test('implied', function() {
            cpuRunner
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
                });
        });

        test('implied, stack overflow', function() {
            cpuRunner
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
                });
        });
    });


    suite('PHP', function() {
        test('implied', function() {
            cpuRunner
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
                });
        });

        test('implied, stack overflow', function() {
            cpuRunner
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
                });
        });
    });

    suite('PLP', function() {
        test('implied', function() {
            cpuRunner
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
                    flags: 0xFF & ~Cpu.Flags.e & ~Cpu.Flags.b
                });
        });

        test('implied, stack underflow', function() {
            cpuRunner
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
                    flags: 0xA7 & ~Cpu.Flags.e & ~Cpu.Flags.b
                });
        });
    });

    suite('PLA', function() {
        test('implied', function() {
            cpuRunner
                .create([0x68])
                .setState({
                    a: 0,
                    s: 0xFE,
                    flags: Cpu.Flags.e
                })
                .poke({
                    '0x01FF': 0xFF
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0xFF,
                    a: 0xFF,
                    flags: Cpu.Flags.e | Cpu.Flags.n
                });
        });

        test('implied, stack underflow', function() {
            cpuRunner
                .create([0x68])
                .setState({
                    a: 0xFF,
                    s: 0xFF,
                    flags: Cpu.Flags.e
                })
                .poke({
                    '0x0100': 0x00
                })
                .run()
                .assertCycles(4)
                .assertState({
                    s: 0x00,
                    a: 0x00,
                    flags: Cpu.Flags.e | Cpu.Flags.z
                });
        });
    });

    suite('ROL', function() {
        testImplied(0x2A, 2,
            {
                a: 0x80,
                flags: Cpu.Flags.e
            }, {
                a: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', 0x80, flags'
        );

        testImplied(0x2A, 2,
            {
                a: 0x80,
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                a: 0x01,
                flags: Cpu.Flags.e | Cpu.Flags.c
            },
            ', 0x80 + c, flags'
        );

        testImplied(0x2A, 2,
            {
                a: 0x40,
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                a: 0x81,
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', 0x40 + c, flags'
        );

        testMutatingZeropage(0x26, 0x80, 0x00, 5,
            {
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', 0x80, flags'
        );

        testMutatingZeropageX(0x36, 0x80, 0x01, 6,
            {
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c
            },
            ', 0x80 + c, flags'
        );

        testMutatingAbsolute(0x2E, 0x40, 0x81, 6,
            {
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', 0x40 + c, flags'
        );

        testMutatingAbsoluteX(0x3E, 0x01, 0x02, 7, 7, {}, {});
    });

    suite('ROR', function() {
        testImplied(0x6A, 2,
            {
                a: 0x01,
                flags: Cpu.Flags.e
            }, {
                a: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', 0x01, flags'
        );

        testImplied(0x6A, 2,
            {
                a: 0x01,
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                a: 0x80,
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.n
            },
            ', 0x01 + c, flags'
        );

        testImplied(0x6A, 2,
            {
                a: 0x40,
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                a: 0xA0,
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', 0x40 + c, flags'
        );

        testMutatingZeropage(0x66, 0x01, 0x00, 5,
            {
                flags: Cpu.Flags.e
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.z
            },
            ', 0x01, flags'
        );

        testMutatingZeropageX(0x76, 0x01, 0x80, 6,
            {
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.c | Cpu.Flags.n
            },
            ', 0x01 + c, flags'
        );

        testMutatingAbsolute(0x6E, 0x40, 0xA0, 6,
            {
                flags: Cpu.Flags.e | Cpu.Flags.c
            }, {
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', 0x40 + c, flags'
        );

        testMutatingAbsoluteX(0x7E, 0x02, 0x01, 7, 7, {}, {});
    });


    suite('RTS', function() {
        test('implied', function() {
            cpuRunner
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
                });
        });

        test('stack underflow', function() {
            cpuRunner
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
                });
        });
    });

    suite('SBC', function() {
        testSbc(0x45, 0x01, 0x44, Cpu.Flags.c, 0);
        testSbc(0x45, 0x36, 0x0F, Cpu.Flags.c, 0);
        testSbc(0x45, 0x36, 0x0F, Cpu.Flags.c, 0);
        testSbc(0x45, 0x50, 0xF5, Cpu.Flags.n, 0);
        testSbc(0xFF, 0xFE, 0x00, Cpu.Flags.z | Cpu.Flags.c, 0, true);
        testSbcBcd(0x34, 0x12, 0x22, Cpu.Flags.c, 0);
        testSbcBcd(0x34, 0x17, 0x17, Cpu.Flags.c, 0);
        testSbcBcd(0x78, 0x80, 0x98, 0, Cpu.Flags.n);
        testSbcBcd(0x56, 0x56, 0x00, Cpu.Flags.c | Cpu.Flags.z, 0);
        testSbcBcd(0x56, 0x56, 0x99, Cpu.Flags.n, 0, true);

        testDereferencingZeropage(0xE5, 0xFF, 3, {a: 0x10}, {a: 0x10});
        testDereferencingZeropageX(0xF5, 0xFF, 4, {a: 0x10}, {a: 0x10});
        testDereferencingAbsolute(0xED, 0xFF, 4, {a: 0x10}, {a: 0x10});
        testDereferencingAbsoluteX(0xFD, 0xFF, 4, 5, {a: 0x10}, {a: 0x10});
        testDereferencingAbsoluteY(0xF9, 0xFF, 4, 5, {a: 0x10}, {a: 0x10});
        testDereferencingIndirectX(0xE1, 0xFF, 6, {a: 0x10}, {a: 0x10});
        testDereferencingIndirectY(0xF1, 0xFF, 5, 6, {a: 0x10}, {a: 0x10});
    });

    setFlagSuite('SEC', 0x38, Cpu.Flags.c);

    setFlagSuite('SED', 0xF8, Cpu.Flags.d);

    setFlagSuite('SEI', 0x78, Cpu.Flags.i);

    suite('STA', function() {
        test('zeroPage , flags', function() {
            cpuRunner
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
                });
        });

        test('zeroPage,X', function() {
            cpuRunner
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
                });
        });

        test('absolute', function() {
            cpuRunner
                .create([0x8D, 0x10, 0x11])
                .setState({
                    a: 0x45
                })
                .run()
                .assertCycles(4)
                .assertState()
                .assertMemory({
                    '0x1110': 0x45
                });
        });

        test('absolute,X', function() {
            cpuRunner
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
                });
        });

        test('absolute,X , page crossing', function() {
            cpuRunner
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
                });
        });

        test('absolute,Y', function() {
            cpuRunner
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
                });
        });

        test('absolute,Y , page crossing', function() {
            cpuRunner
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
                });
        });

        test('indirect,X , wraparound during address read', function() {
            cpuRunner
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
                });
        });

        test('indirect,Y', function() {
            cpuRunner
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
                });
        });

        test('indirect,Y , page crossing', function() {
            cpuRunner
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
                });
        });
    });

    suite('STX', function() {
        test('zeroPage', function() {
            cpuRunner
                .create([0x86, 0x45])
                .setState({
                    x: 0x24
                })
                .run()
                .assertCycles(3)
                .assertMemory({
                    '0x0045': 0x24
                });
        });

        test('zeroPage,Y', function() {
            cpuRunner
                .create([0x96, 0x45])
                .setState({
                    x: 0x24,
                    y: 0x01
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x0046': 0x24
                });
        });

        test('absolute', function() {
            cpuRunner
                .create([0x8E, 0x45, 0x73])
                .setState({
                    x: 0x24
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x7345': 0x24
                });
        });
    });

    suite('STY', function() {
        test('zeroPage', function() {
            cpuRunner
                .create([0x84, 0x45])
                .setState({
                    y: 0x24
                })
                .run()
                .assertCycles(3)
                .assertMemory({
                    '0x0045': 0x24
                });
        });

        test('zeroPage,X', function() {
            cpuRunner
                .create([0x94, 0x45])
                .setState({
                    y: 0x24,
                    x: 0x01
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x0046': 0x24
                });
        });

        test('absolute', function() {
            cpuRunner
                .create([0x8C, 0x45, 0x73])
                .setState({
                    y: 0x24
                })
                .run()
                .assertCycles(4)
                .assertMemory({
                    '0x7345': 0x24
                });
        });
    });

    suite('TAX', function() {
        testImplied(0xAA, 2,
            {
                a: 0xFF,
                x: 0,
                flags: Cpu.Flags.e
            }, {
                x: 0xFF,
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', 0xFF, flags'
        );

        testImplied(0xAA, 2,
            {
                a: 0x00,
                x: 0xFF,
                flags: Cpu.Flags.e
            }, {
                x: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.z
            },
            ', 0x00, flags'
        );
    });

    suite('TAY', function() {
        testImplied(0xA8, 2,
            {
                a: 0xFF,
                y: 0,
                flags: Cpu.Flags.e
            }, {
                y: 0xFF,
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', 0xFF, flags'
        );

        testImplied(0xA8, 2,
            {
                a: 0x00,
                y: 0xFF,
                flags: Cpu.Flags.e
            }, {
                y: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.z
            },
            ', 0x00, flags'
        );
    });

    suite('TSX', function() {
        testImplied(0xBA, 2,
            {
                s: 0x45,
                x: 0x00,
                flags: 0xFF
            }, {
                x:0x45,
                flags: 0xFF & ~Cpu.Flags.z & ~Cpu.Flags.n
            }
        );
    });

    suite('TXA', function() {
        testImplied(0x8A, 2,
            {
                x: 0x11,
                a: 0x00
            }, {
                x: 0x11,
                a: 0x11
            },
            ', 0x11'
        );

        testImplied(0x8A, 2,
            {
                x: 0xFF,
                a: 0x00,
                flags: Cpu.Flags.e
            }, {
                x: 0xFF,
                a: 0xFF,
                flags: Cpu.Flags.e | Cpu.Flags.n
            },
            ', 0xFF'
        );

        testImplied(0x8A, 2,
            {
                x: 0x00,
                a: 0xFF,
                flags: Cpu.Flags.e
            }, {
                x: 0x00,
                a: 0x00,
                flags: Cpu.Flags.e | Cpu.Flags.z
            },
            ', 0x00'
        );
    });

    suite('TXS', function() {
        test('implied, flags', function() {
            cpuRunner
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
                });
        });
    });

    suite('TYA', function() {
        test('implied, flags', function() {
            cpuRunner
                .create([0x98])
                .setState({
                    y: 0xFF,
                    a: 0,
                    flags: 0xFF & ~Cpu.Flags.n
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0xFF,
                    flags: 0xFF & ~Cpu.Flags.z
                });
        });
    });
});
