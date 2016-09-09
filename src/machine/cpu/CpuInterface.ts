interface CpuInterface {
    setInterrupt(): CpuInterface;

    clearInterrupt(): CpuInterface;

    isInterrupt(): boolean;

    nmi(): CpuInterface;

    halt(): CpuInterface;

    resume(): CpuInterface;

    isHalt(): boolean;

    setInvalidInstructionCallback(
            callback: CpuInterface.InvalidInstructionCallbackInterface
        ): CpuInterface;

    getInvalidInstructionCallback(): CpuInterface.InvalidInstructionCallbackInterface;

    getLastInstructionPointer(): number;

    reset(): CpuInterface;

    cycle(): CpuInterface;

    executionState: CpuInterface.ExecutionState;
    state: CpuInterface.State;
}

module CpuInterface {
    export const enum ExecutionState {
        boot, fetch, execute
    }

    export class State {
        a: number = 0;
        x: number = 0;
        y: number = 0;
        s: number = 0;
        p: number = 0;
        flags: number = 0;
    }

    export const enum Flags {
        c = 0x01,   // carry
        z = 0x02,   // zero
        i = 0x04,   // interrupt
        d = 0x08,   // decimal mode
        b = 0x10,   // break
        e = 0x20,   // reserved
        v = 0x40,   // overflow
        n = 0x80    // sign
    }

    export interface InvalidInstructionCallbackInterface {
        (cpu?: CpuInterface): void;
    }
}

export default CpuInterface;
