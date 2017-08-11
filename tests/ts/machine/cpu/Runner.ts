/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import Cpu from '../../../../src/machine/cpu/Cpu';
import CpuInterface from '../../../../src/machine/cpu/CpuInterface';
import InstrumentedBus from './InstrumentedBus';
import AccessLog from './AccessLog';
import * as hex from '../../../../src/tools/hex.js';
import * as binary from '../../../../src/tools/binary';
class Runner {

    constructor(
        private _code: {length: number, [address: number]: number},
        private _base = 0xE000
    ) {
        this._bus = new InstrumentedBus();
        this._cpu = new Cpu(this._bus);

        for (let i = 0; i < this._code.length; i++) {
            this._bus.write(this._base + i, this._code[i]);
        }

        this._bus.write(0xFFFC, this._base & 0xFF);
        this._bus.write(0xFFFD, this._base >> 8);

        this._cpu.reset();

        while (this._cpu.executionState !== CpuInterface.ExecutionState.fetch) {
            this._cpu.cycle();
        }
    }

    static create(
        code?: {length: number, [address: number]: number},
        base?: number
    ): Runner {
        return new Runner(code, base);
    }

    setState(state: Runner.State): this {
        Object.assign(this._cpu.state, state);

        return this;
    }

    poke(pokes: {[address: string]: number}): this {
        Object.keys(pokes).forEach(address => {
            this._bus.write(hex.decode(address), pokes[address]);
        });

        return this;
    }

    run(maxCycles = 100) {
        const codeEnd = this._base + this._code.length;
        let pBeforeExecute = this._cpu.state.p;

        this._cycles = 0;
        this._originalState = Object.assign(new CpuInterface.State(), this._cpu.state);

        this._cpu.setInvalidInstructionCallback(() => {
            throw new Error('invalid instruction!');
        });

        this._bus.getLog().clear();

        while (pBeforeExecute !== codeEnd && this._cycles <= maxCycles) {
            do {
                pBeforeExecute = this._cpu.state.p;
                this._cpu.cycle();
                this._cycles++;
            } while (this._cpu.executionState !== CpuInterface.ExecutionState.fetch);
        }

        if (this._cycles > maxCycles) {
            throw new Error('maximum execution cycles exceeded');
        }

        return this;
    }

    runTo(codeEnd: number, maxCycles = 100) {
        this._cycles = 0;
        this._originalState = Object.assign(new CpuInterface.State(), this._cpu.state);

        this._cpu.setInvalidInstructionCallback(() => {
            throw new Error('invalid instruction!');
        });

        this._bus.getLog().clear();

        while (this._cpu.state.p !== codeEnd && this._cycles <= maxCycles) {
            do {
                this._cpu.cycle();
                this._cycles++;
            } while (this._cpu.executionState !== CpuInterface.ExecutionState.fetch);
        }

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

            const referenceValue = state.hasOwnProperty(property) ?
                    (state as any)[property] : (this._originalState as any)[property],
                actual: number = (this._cpu.state as any)[property];

            if (referenceValue !== actual) {
                throw new Error(
                    `expected ${property.toUpperCase()} to be ${hex.encode(referenceValue, 2)}, ` +
                    `got ${hex.encode(actual, 2)}`
                );
            }
        });

        const reference = state.hasOwnProperty('flags') ? state.flags : this._originalState.flags;

        if (reference !== this._cpu.state.flags)
        {
            throw new Error(
                `expected flags to be ${binary.encode(reference, 8)}, ` +
                `got ${binary.encode(this._cpu.state.flags, 8)}`
            );
        }

        if (state.hasOwnProperty('p') && state.p !== this._cpu.state.p) {
            throw new Error(
                `expected P to be ${hex.encode(state.p, 4)}, ` +
                `got ${hex.encode(this._cpu.state.p, 4)}`
            );
        }

        return this;
    }

    assertMemory(checks: {[address: string]: number}): this {
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

}

export default Runner;
