/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import CpuInterface from '../../../../../src/machine/cpu/CpuInterface';
import StateMachineInterface from '../../../../../src/machine/cpu/statemachine/StateMachineInterface';
import { encode as toHex } from '../../../../../src/tools/hex';
import deepEqual = require('deep-equal');

export const incrementP = (s: CpuInterface.State) => ({ ...s, p: s.p + 1 });

export class Builder {
    read(address: number, value: number): this {
        this._pushCurrentCycle();

        this._currentCycle = {
            busOperation: {
                type: Runner.BusOperationType.read,
                address,
                value
            }
        };

        return this;
    }

    write(address: number, value: number): this {
        this._pushCurrentCycle();

        this._currentCycle = {
            busOperation: {
                type: Runner.BusOperationType.write,
                address,
                value
            }
        };

        return this;
    }

    result(result: (s: CpuInterface.State) => CpuInterface.State): this {
        this._currentCycle.result = result;

        return this;
    }

    run<S extends StateMachineInterface<S, O>, O>(
        prepareState: (s: CpuInterface.State) => CpuInterface.State,
        createStateMachine: (state: CpuInterface.State, bus: StateMachineInterface.BusInterface) => S,
        operand: O
    ): Runner<S, O> {
        this._pushCurrentCycle();

        const runner = new Runner(this._cycles, prepareState(new CpuInterface.State()), createStateMachine);

        return runner.run(operand);
    }

    private _pushCurrentCycle(): void {
        if (this._currentCycle) {
            this._cycles.push(this._currentCycle);
        }
    }

    private _currentCycle: Runner.Cycle = null;
    private readonly _cycles = new Array<Runner.Cycle>();
}

class Runner<S extends StateMachineInterface<S, O>, O> {
    constructor(
        private readonly _cycles: Array<Runner.Cycle>,
        private readonly _state: CpuInterface.State,
        createStateMachine: (state: CpuInterface.State, bus: StateMachineInterface.BusInterface) => S
    ) {
        this._stateMachine = createStateMachine(this._state, {
            read: this._read.bind(this),
            write: this._write.bind(this)
        });
    }

    run(operand: O): this {
        this._step = 0;
        let nextStep = this._stateMachine.reset(operand);

        while (nextStep !== null) {
            this._busAccessComplete = false;
            const cycle = this._cycles[this._step];
            const state = cycle.result ? cycle.result(this._state) : { ...this._state };

            nextStep = nextStep(this._stateMachine);
            this._step++;

            if (nextStep === null && this._step !== this._cycles.length) {
                throw new Error(`expected ${this._cycles.length} steps, but completed in ${this._step}`);
            }

            if (nextStep !== null && this._step === this._cycles.length) {
                throw new Error(`expected ${this._cycles.length} steps, but state machine did not complete`);
            }

            if (!this._busAccessComplete) {
                throw new Error(`no bus access in step ${this._step}`);
            }

            if (!deepEqual(this._state, state)) {
                throw new Error(
                    `state mismath in step ${this._step}: expected ${JSON.stringify(
                        state,
                        undefined,
                        '  '
                    )}, got ${JSON.stringify(this._state, undefined, '  ')}`
                );
            }
        }

        return this;
    }

    assert(assertion: (s: S) => void) {
        assertion(this._stateMachine);
    }

    private _read(address: number): number {
        const operation = this._cycles[this._step].busOperation;

        if (this._busAccessComplete) {
            throw new Error(`second bus access in step ${this._step}`);
        }
        this._busAccessComplete = true;

        if (operation.type !== Runner.BusOperationType.read) {
            throw new Error(`Expected a read operation, but got a write in step ${this._step}`);
        }

        if (address !== operation.address) {
            throw new Error(
                `Expected an access to ${toHex(operation.address)}, but got an access to ${toHex(
                    address
                )} instead in step ${this._step}`
            );
        }

        return operation.value;
    }

    private _write(address: number, value: number): void {
        const operation = this._cycles[this._step].busOperation;

        if (this._busAccessComplete) {
            throw new Error(`second bus access in step ${this._step}`);
        }
        this._busAccessComplete = true;

        if (operation.type !== Runner.BusOperationType.write) {
            throw new Error(`Expected a write operation, but got a read in step ${this._step}`);
        }

        if (address !== operation.address) {
            throw new Error(
                `Expected an access to ${toHex(operation.address)}, but got an access to ${toHex(
                    address
                )} instead in step ${this._step}`
            );
        }

        if (value !== operation.value) {
            throw new Error(
                `Expected ${toHex(operation.value)} to be written, but got ${toHex(value)} instead in step ${
                    this._step
                }`
            );
        }
    }

    private _step = 0;
    private _busAccessComplete = false;

    private readonly _stateMachine: S = null;
}

namespace Runner {
    export const enum BusOperationType {
        read,
        write
    }

    export interface BusRead {
        type: BusOperationType.read;
        address: number;
        value: number;
    }

    export interface BusWrite {
        type: BusOperationType.write;
        address: number;
        value: number;
    }

    export type BusOperation = BusWrite | BusRead;

    export interface Cycle {
        busOperation: BusOperation;
        result?: (s: CpuInterface.State) => CpuInterface.State;
    }

    export const build = () => new Builder();
}

export default Runner;
