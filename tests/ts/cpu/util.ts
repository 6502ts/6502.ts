import Runner from './Runner';

export function testImplied(
    opcode: number,
    cycles: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    test(`implied ${extra}`, () => Runner
        .create([opcode])
        .setState(stateBefore)
        .run()
        .assertCycles(cycles)
        .assertState(stateAfter)
    );
}

export function testImmediate(
    opcode: number,
    operand: number,
    cycles: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    test(`immediate: ${extra}`, () => Runner
        .create([opcode, operand])
        .setState(stateBefore)
        .run()
        .assertCycles(cycles)
        .assertState(stateAfter)
    );
}

export function testDereferencingZeropage(
    opcode: number,
    operand: number,
    cycles: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    test(`zeropage ${extra}`, () => Runner
        .create([opcode, 0x34])
        .setState(stateBefore)
        .poke({
            '0x0034': operand
        })
        .run()
        .assertCycles(cycles)
        .assertState(stateAfter)
    );
}

export function testDereferencingZeropageX(
    opcode: number,
    operand: number,
    cycles: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    stateBefore.x = 0x12;

    test(`zeropage,X ${extra}`, () => Runner
        .create([opcode, 0x34])
        .setState(stateBefore)
        .poke({
            '0x0046': operand
        })
        .run()
        .assertCycles(cycles)
        .assertState(stateAfter)
    );
}

export function testDereferencingAbsolute(
    opcode: number,
    operand: number,
    cycles: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    test(`absolute ${extra}`, () => Runner
        .create([opcode, 0x34, 0x56])
        .setState(stateBefore)
        .poke({
            '0x5634': operand
        })
        .run()
        .assertCycles(cycles)
        .assertState(stateAfter)
    );
}

export function testDereferencingAbsoluteX(
    opcode: number,
    operand: number,
    cycles: number,
    cyclesCross: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    stateBefore.x = 0x12;

    test(`absolute,X ${extra}`, () => Runner
        .create([opcode, 0x34, 0x55])
        .setState(stateBefore)
        .poke({
            '0x5546': operand
        })
        .run()
        .assertCycles(cycles)
        .assertState(stateAfter)
    );

    test(`absolute,X (page crossing) ${extra}`, () => Runner
        .create([opcode, 0xEE, 0x55])
        .setState(stateBefore)
        .poke({
            '0x5600': operand
        })
        .run()
        .assertCycles(cyclesCross)
        .assertState(stateAfter)
    );
}

export function testDereferencingAbsoluteY(
    opcode: number,
    operand: number,
    cycles: number,
    cyclesCross: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    stateBefore.y = 0x12;

    test(`absolute,Y ${extra}`, () => Runner
        .create([opcode, 0x34, 0x55])
        .setState(stateBefore)
        .poke({
            '0x5546': operand
        })
        .run()
        .assertCycles(cycles)
        .assertState(stateAfter)
    );

    test(`absolute,Y (page crossing) ${extra}`, () => Runner
        .create([opcode, 0xEE, 0x55])
        .setState(stateBefore)
        .poke({
            '0x5600': operand
        })
        .run()
        .assertCycles(cyclesCross)
        .assertState(stateAfter)
    );
}

export function testDereferencingIndirectX(
    opcode: number,
    operand: number,
    cycles: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    stateBefore.x = 0x12;

    test(`indirect,X ${extra}`, () => Runner
        .create([opcode, 0x34])
        .setState(stateBefore)
        .poke({
            '0x0046': 0x87,
            '0x0047': 0x6E,
            '0x6E87': operand
        })
        .run()
        .assertCycles(cycles)
        .assertState(stateAfter)
    );
}

export function testDereferencingIndirectY(
    opcode: number,
    operand: number,
    cycles: number,
    cyclesCross: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    stateBefore.y = 0x12;

    test(`indirect,Y ${extra}`, () => Runner
        .create([opcode, 0x34])
        .setState(stateBefore)
        .poke({
            '0x0034': 0x87,
            '0x0035': 0x6E,
            '0x6E99': operand
        })
        .run()
        .assertCycles(cycles)
        .assertState(stateAfter)
    );

    test(`indirect,Y (page crossing) ${extra}`, () => Runner
        .create([opcode, 0x34])
        .setState(stateBefore)
        .poke({
            '0x0034': 0xFF,
            '0x0035': 0x6E,
            '0x6F11': operand
        })
        .run()
        .assertCycles(cyclesCross)
        .assertState(stateAfter)
    );
}

export function testMutatingZeropage(
    opcode: number,
    before: number,
    after: number,
    cycles: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    test(`zeropage ${extra}`, () => Runner
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
        })
    );
}

export function testMutatingZeropageX(
    opcode: number,
    before: number,
    after: number,
    cycles: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    stateBefore.x = 0x12;

    test(`zeropage,X ${extra}`, () => Runner
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
        })
    );
}

export function testMutatingAbsolute(
    opcode: number,
    before: number,
    after: number,
    cycles: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    test(`absolute ${extra}`, () => Runner
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
        })
    );
}

export function testMutatingAbsoluteX(
    opcode: number,
    before: number,
    after: number,
    cycles: number,
    cyclesCross: number,
    stateBefore: Runner.State,
    stateAfter: Runner.State,
    extra = ''
): void {
    stateBefore.x = 0x12;

    test(`absolute,X ${extra}`, () => Runner
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
        })
    );

    test(`absolute,X (page crossing) ${extra}`, () => Runner
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
        })
    );
}