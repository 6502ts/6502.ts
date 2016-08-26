import Runner from './Runner';
import CpuInterface from '../../../../src/machine/cpu/CpuInterface';

function clearFlagSuite(
    mnemonic: string,
    opcode: number,
    flag: number
) {
    suite(mnemonic, function() {
        test('implied', () => Runner
            .create([opcode])
            .setState({
                flags: CpuInterface.Flags.e | flag
            })
            .run()
            .assertCycles(2)
            .assertState({
                flags: CpuInterface.Flags.e
            })
        );
    });
}

function setFlagSuite(
    mnemonic: string,
    opcode: number,
    flag: number
) {
    suite(mnemonic, function() {
        test('implied', () => Runner
            .create([opcode])
            .setState({
                flags: CpuInterface.Flags.e
            })
            .run()
            .assertCycles(2)
            .assertState({
                flags: CpuInterface.Flags.e | flag
            })
        );
    });
}

export function run(): void {
    clearFlagSuite('CLC', 0x18, CpuInterface.Flags.c);

    clearFlagSuite('CLD', 0xD8, CpuInterface.Flags.d);

    clearFlagSuite('CLI', 0x58, CpuInterface.Flags.i);

    clearFlagSuite('CLV', 0xB8, CpuInterface.Flags.v);

    setFlagSuite('SEC', 0x38, CpuInterface.Flags.c);

    setFlagSuite('SED', 0xF8, CpuInterface.Flags.d);

    setFlagSuite('SEI', 0x78, CpuInterface.Flags.i);
}