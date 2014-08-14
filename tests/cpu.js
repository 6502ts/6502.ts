var cpuRunner = require('./runner/cpu'),
    Cpu = require('../src/Cpu'),
    hex = require('../src/hex'),
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
        test('vanilla', function() {
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
        test('vanilla', function() {
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

function testDereferencingZeropageX(opcode, operand, cycles, stateBefore, stateAfter) {
    stateBefore.x = 0x12;

    test('zeroPage,X', function() {
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

function testDereferencingZeropage(opcode, operand, cycles, stateBefore, stateAfter) {
    test('zeroPage', function() {
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

function testDereferencingAbsolute(opcode, operand, cycles, stateBefore, stateAfter) {
    test('absolute', function() {
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

function testDereferencingAbsoluteX(opcode, operand, cycles, cyclesCross, stateBefore, stateAfter) {
    stateBefore.x = 0x12;

    test('absolute,X', function() {
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

    test('absolute,X , page crossing', function() {
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

function testDereferencingAbsoluteY(opcode, operand, cycles, cyclesCross, stateBefore, stateAfter) {
    stateBefore.y = 0x12;

    test('absolute,Y', function() {
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

    test('absolute,Y , page crossing', function() {
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

function testDereferencingIndirectX(opcode, operand, cycles, stateBefore, stateAfter) {
    stateBefore.x = 0x12;

    test('indirect,X', function() {
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

function testDereferencingIndirectY(opcode, operand, cycles, cyclesCross, stateBefore, stateAfter) {
    stateBefore.y = 0x12;

    test('indirect,Y', function() {
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

    test('indirect,Y , page crossing', function() {
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

suite('CPU', function() {

    suite('ADC', function() {
        testAdc(0x01, 0x30, 0x31, 0, Cpu.Flags.v);
        testAdc(0x01, 0x30, 0x32, 0, Cpu.Flags.v, true);
        testAdc(0xFE, 0x02, 0x00, Cpu.Flags.c | Cpu.Flags.z, Cpu.Flags.v);
        testAdc(0x80, 0x70, 0xF0, Cpu.Flags.n);
        testAdcNeg(0x01, -0x01, 0x00, Cpu.Flags.z, Cpu.Flags.c)
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
                })
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
                })
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
                })
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
                })
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
                })
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
                })
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
                })
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
                })
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
                })
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
                })
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
                })
        });

    });

    branchSuite('BCC', 0x90, 0, Cpu.Flags.c);

    branchSuite('BNE', 0xD0, 0, Cpu.Flags.z);

    branchSuite('BEQ', 0xF0, Cpu.Flags.z, 0);

    branchSuite('BPL', 0x10, 0, Cpu.Flags.n);

    clearFlagSuite('CLC', 0x18, Cpu.Flags.c);

    clearFlagSuite('CLD', 0xD8, Cpu.Flags.d);

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
        test('vanilla', function() {
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

    suite('NOP', function() {
        test('vanilla', function() {
            cpuRunner
                .create([0xEA])
                .run()
                .assertCycles(2)
                .assertState();
        });
    });

    suite('RTS', function() {
        test('vanilla', function() {
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

    setFlagSuite('SEC', 0x38, Cpu.Flags.c);

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


    suite('TXS', function() {
        test('vanilla, flags', function() {
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
        test('vanilla, flags', function() {
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
