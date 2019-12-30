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

import CpuInterface from '../../../../src/machine/cpu/CpuInterface';
import BusInterface from '../../../../src/machine/bus/BusInterface';
import InstrumentedBus from './InstrumentedBus';
import AccessLog from './AccessLog';
import * as hex from '../../../../src/tools/hex';
import * as binary from '../../../../src/tools/binary';

class Runner {
    constructor(
        cpuFactory: Runner.CpuFactory,
        private _code: { length: number; [address: number]: number },
        private _base = 0xe000
    ) {
        this._bus = new InstrumentedBus();
        this._cpu = cpuFactory(this._bus);

        for (let i = 0; i < this._code.length; i++) {
            this._bus.write(this._base + i, this._code[i]);
        }

        this._bus.write(0xfffc, this._base & 0xff);
        this._bus.write(0xfffd, this._base >> 8);

        this._cpu.reset();

        while (this._cpu.executionState !== CpuInterface.ExecutionState.fetch) {
            this._cpu.cycle();
        }
    }

    static create(
        cpuFactory: Runner.CpuFactory,
        code?: { length: number; [address: number]: number },
        base?: number
    ): Runner {
        return new Runner(cpuFactory, code, base);
    }

    setState(state: Runner.State): this {
        Object.assign(this._cpu.state, state);

        return this;
    }

    poke(pokes: { [address: string]: number }): this {
        Object.keys(pokes).forEach(address => {
            this._bus.write(hex.decode(address), pokes[address]);
        });

        return this;
    }

    run(expectedInstructionCycles = 1, maxCycles = 100) {
        this._cycles = 0;
        this._originalState = Object.assign(new CpuInterface.State(), this._cpu.state);

        this._cpu.setInvalidInstructionCallback(() => {
            throw new Error('invalid instruction!');
        });

        this._bus.getLog().clear();

        let instructionCycles = 0;
        do {
            this._cpu.cycle();
            this._cycles++;

            if (this._cpu.executionState === CpuInterface.ExecutionState.fetch) {
                instructionCycles++;
            }
        } while (this._cycles <= maxCycles && instructionCycles < expectedInstructionCycles);

        if (this._cycles > maxCycles) {
            throw new Error('maximum execution cycles exceeded');
        }

        return this;
    }

    runFor(cycles: number) {
        this._originalState = Object.assign(new CpuInterface.State(), this._cpu.state);
        this._cycles = 0;

        this._cpu.setInvalidInstructionCallback(() => {
            throw new Error('invalid instruction!');
        });

        this._bus.getLog().clear();

        for (let i = 0; i < cycles; i++) {
            this._cpu.cycle();
            this._cycles++;
        }

        return this;
    }

    assertCycles(cycles: number): this {
        if (this._cycles !== cycles) {
            throw new Error(`Cycle count mismatch, expected ${cycles}, got ${this._cycles}`);
        }

        return this;
    }

    assertState(state: Runner.State = {}): this {
        ['a', 'x', 'y', 's'].forEach(property => {
            const referenceValue = state.hasOwnProperty(property)
                    ? (state as any)[property]
                    : (this._originalState as any)[property],
                actual: number = (this._cpu.state as any)[property];

            if (referenceValue !== actual) {
                throw new Error(
                    `expected ${property.toUpperCase()} to be ${hex.encode(referenceValue, 2)}, ` +
                        `got ${hex.encode(actual, 2)}`
                );
            }
        });

        const reference = state.hasOwnProperty('flags') ? state.flags : this._originalState.flags;

        if (reference !== this._cpu.state.flags) {
            throw new Error(
                `expected flags to be ${binary.encode(reference, 8)}, ` +
                    `got ${binary.encode(this._cpu.state.flags, 8)}`
            );
        }

        if (state.hasOwnProperty('p') && state.p !== this._cpu.state.p) {
            throw new Error(`expected P to be ${hex.encode(state.p, 4)}, ` + `got ${hex.encode(this._cpu.state.p, 4)}`);
        }

        return this;
    }

    assertMemory(checks: { [address: string]: number }): this {
        Object.keys(checks).forEach(address => {
            const actual = this._bus.read(hex.decode(address));

            if (checks[address] !== actual) {
                throw new Error(
                    `memory corrupt at ${address}; expected ${hex.encode(checks[address], 2)}, ` +
                        `got ${hex.encode(actual, 2)}`
                );
            }
        });

        return this;
    }

    assertAccessLog(log: AccessLog): this {
        this._bus.getLog().assertEqual(log);

        return this;
    }

    getCpu(): CpuInterface {
        return this._cpu;
    }

    configure(cb: (cpu: CpuInterface) => any): this {
        cb(this._cpu);

        return this;
    }

    private _bus: InstrumentedBus;
    private _cpu: CpuInterface;
    private _cycles = 0;
    private _originalState: CpuInterface.State = null;
}

namespace Runner {
    export interface State {
        a?: number;
        x?: number;
        y?: number;
        s?: number;
        p?: number;
        flags?: number;
    }

    export interface CpuFactory {
        (bus: BusInterface): CpuInterface;
    }
}

export { Runner as default };
