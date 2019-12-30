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

interface CpuInterface {
    setInterrupt(irq: boolean): CpuInterface;

    isInterrupt(): boolean;

    nmi(): CpuInterface;

    halt(): CpuInterface;

    resume(): CpuInterface;

    isHalt(): boolean;

    setInvalidInstructionCallback(callback: CpuInterface.InvalidInstructionCallbackInterface): CpuInterface;

    getInvalidInstructionCallback(): CpuInterface.InvalidInstructionCallbackInterface;

    getLastInstructionPointer(): number;

    reset(): CpuInterface;

    cycle(): CpuInterface;

    executionState: CpuInterface.ExecutionState;
    state: CpuInterface.State;
}

namespace CpuInterface {
    export const enum ExecutionState {
        boot,
        fetch,
        execute
    }

    export class State {
        a: number = 0;
        x: number = 0;
        y: number = 0;
        s: number = 0;
        p: number = 0;
        flags: number = 0;

        irq = false;
        nmi = false;
    }

    export const enum Flags {
        c = 0x01, // carry
        z = 0x02, // zero
        i = 0x04, // interrupt
        d = 0x08, // decimal mode
        b = 0x10, // break
        e = 0x20, // reserved
        v = 0x40, // overflow
        n = 0x80 // sign
    }

    export interface InvalidInstructionCallbackInterface {
        (cpu?: CpuInterface): void;
    }
}

export { CpuInterface as default };
