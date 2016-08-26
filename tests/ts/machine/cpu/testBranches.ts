import Runner from './Runner';
import CpuInterface from '../../../../src/machine/cpu/CpuInterface';

function branchSuite(
    mnemonic: string,
    opcode: number,
    jumpCondition: number,
    noJumpCondition: number
): void {
    suite(mnemonic, function() {
        test('immediate, no branch', () => Runner
            .create([opcode, 0x0F], 0xE000)
            .setState({
                flags: noJumpCondition
            })
            .run()
            .assertCycles(2)
            .assertState({
                p: 0xE000 + 2
            })
        );

        test('immediate, forward branch', () => Runner
            .create([opcode, 0x0F], 0xE000)
            .setState({
                flags: jumpCondition
            })
            .run()
            .assertCycles(3)
            .assertState({
                p: 0xE000 + 2 + 0x0F
            })
        );

        test('immediate, backward branch, page crossing', () => Runner
            .create([opcode, (~0x0A & 0xFF) + 1], 0xE000)
            .setState({
                flags: jumpCondition
            })
            .run()
            .assertCycles(4)
            .assertState({
                p: 0xE000 + 2 - 0x0A
            })
        );

    });
}

export function run(): void {
    branchSuite('BCC', 0x90, 0, CpuInterface.Flags.c);

    branchSuite('BNE', 0xD0, 0, CpuInterface.Flags.z);

    branchSuite('BEQ', 0xF0, CpuInterface.Flags.z, 0);

    branchSuite('BPL', 0x10, 0, CpuInterface.Flags.n);

    branchSuite('BMI', 0x30, CpuInterface.Flags.n, 0);

    branchSuite('BVC', 0x50, 0, CpuInterface.Flags.v);

    branchSuite('BVS', 0x70, CpuInterface.Flags.v, 0);
}