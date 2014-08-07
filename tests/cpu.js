var cpuRunner = require('./runner/cpu');

function branchSuite(name, opcode, jumpCondition) {
    suite(name, function() {
        test('immediate, no branch', function() {
            cpuRunner
                .create([opcode, 0x0F], 0xE000)
                .setState({
                    flags: ~jumpCondition & 0xFF
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

suite('CPU', function() {

    suite('CLC', function() {
        test('vanilla', function() {
            cpuRunner
                .create([0x18])
                .setState({
                    flags: parseInt('10000001', 2)
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0x80
                });
        });
    });

    suite('CLD', function() {
        test('vanilla', function() {
            cpuRunner
                .create([0xD8])
                .setState({
                    flags: parseInt('10001000', 2)
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: 0x80
                });
        });
    });

    branchSuite('BNE', 0xD0, 0);

    branchSuite('BEQ', 0xF0, 0xFF);

    suite('DEY', function() {
        test('starting with 0x01', function() {
            cpuRunner
                .create([0x88])
                .setState({
                    y: 0x01,
                    flags: parseInt('10000000', 2)
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: parseInt('00000010', 2),
                    y: 0
                });
        });

        test('starting with 0x00', function() {
            cpuRunner
                .create([0x88])
                .setState({
                    y: 0,
                    flags: parseInt('00000010', 2)
                })
                .run()
                .assertCycles(2)
                .assertState({
                    flags: parseInt('10000000', 2),
                    y: 0xFF
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
    });

    suite('LDA', function() {
        test('immediate', function() {
            cpuRunner
                .create([0xA9, 0])
                .setState({
                    a: 0x10,
                    flags: parseInt('10000000', 2)
                })
                .run()
                .assertCycles(2)
                .assertState({
                    a: 0,
                    flags: parseInt('00000010', 2)
                });
        });

        test('zeroPage', function() {
            cpuRunner
                .create([0xA5, 0x12])
                .poke({
                    '0x12': 0xFF
                })
                .setState({
                    flags: parseInt('00000010', 2)
                })
                .run()
                .assertCycles(3)
                .assertState({
                    a: 0xFF,
                    flags: parseInt('10000000', 2)
                });
        });

        test('zeroPage, X', function() {
            cpuRunner
                .create([0xB5, 0x12])
                .setState({
                    x: 0xFE
                })
                .poke({
                    '0x10': 0x34
                })
                .run()
                .assertCycles(4)
                .assertState({
                    a: 0x34
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
    });
});
