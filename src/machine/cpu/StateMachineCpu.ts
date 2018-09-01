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

import CpuInterface from './CpuInterface';
import StateMachineInterface from './statemachine/StateMachineInterface';
import BusInterface from '../bus/BusInterface';
import RngInterface from '../../tools/rng/GeneratorInterface';
import { boot, irq, nmi } from './statemachine/vector';
import Compiler from './statemachine/Compiler';

class StateMachineCpu implements CpuInterface {
    constructor(private _bus: BusInterface, private _rng?: RngInterface) {
        this._opBoot = boot(this.state);
        this._opIrq = irq(this.state);
        this._opNmi = nmi(this.state);

        const compiler = new Compiler(this.state);
        for (let op = 0; op < 256; op++) {
            this._operations[op] = compiler.compile(op);
        }

        this.reset();
    }

    reset(): this {
        this.state.a = this._rng ? this._rng.int(0xff) : 0;
        this.state.x = this._rng ? this._rng.int(0xff) : 0;
        this.state.y = this._rng ? this._rng.int(0xff) : 0;
        this.state.s = 0xfd;
        this.state.p = this._rng ? this._rng.int(0xffff) : 0;
        this.state.flags =
            (this._rng ? this._rng.int(0xff) : 0) | CpuInterface.Flags.i | CpuInterface.Flags.e | CpuInterface.Flags.b;
        this.state.irq = false;
        this.state.nmi = false;

        this.executionState = CpuInterface.ExecutionState.boot;
        this._interruptPending = false;
        this._nmiPending = false;
        this._halt = false;
        this._lastResult = this._opBoot.reset(undefined);
        this._lastInstructionPointer = 0;

        return this;
    }

    setInterrupt(i: boolean): this {
        this._interruptPending = i;

        return this;
    }

    isInterrupt(): boolean {
        return this._interruptPending;
    }

    nmi(): this {
        this._nmiPending = true;

        return this;
    }

    halt(): this {
        this._halt = true;

        return this;
    }

    resume(): this {
        this._halt = false;

        return this;
    }

    isHalt(): boolean {
        return this._halt;
    }

    setInvalidInstructionCallback(callback: CpuInterface.InvalidInstructionCallbackInterface): this {
        this._invalidInstructionCallback = callback;

        return this;
    }

    getInvalidInstructionCallback(): CpuInterface.InvalidInstructionCallbackInterface {
        return this._invalidInstructionCallback;
    }

    getLastInstructionPointer(): number {
        return this._lastInstructionPointer;
    }

    cycle(): this {
        if (this._halt && (!this._lastResult || this._lastResult.cycleType === StateMachineInterface.CycleType.read)) {
            return this;
        }

        if (this.executionState === CpuInterface.ExecutionState.fetch) {
            this._fetch();
            return this;
        }

        let value: number;

        switch (this._lastResult.cycleType) {
            case StateMachineInterface.CycleType.read:
                value = this._bus.read(this._lastResult.address);
                break;

            case StateMachineInterface.CycleType.write:
                value = this._lastResult.value;
                this._bus.write(this._lastResult.address, value);
                break;

            default:
                throw new Error('invalid cycle type');
        }

        if (this._lastResult.pollInterrupts) {
            this._pollInterrupts();

            this._lastResult.pollInterrupts = false;
            this._pollInterruptsAfterLastInstruction = false;
        }

        this._lastResult = this._lastResult.nextStep(value);
        if (this._lastResult === null) {
            this.executionState = CpuInterface.ExecutionState.fetch;
        }

        return this;
    }

    private _fetch(): void {
        if (this._pollInterruptsAfterLastInstruction) {
            this._pollInterrupts();
        }

        this._lastInstructionPointer = this.state.p;

        let operation: StateMachineInterface;
        const opcode = this._bus.read(this.state.p);

        if (this.state.nmi) {
            operation = this._opNmi;
            this._pollInterruptsAfterLastInstruction = false;
        } else if (this.state.irq) {
            operation = this._opIrq;
            this._pollInterruptsAfterLastInstruction = false;
        } else {
            operation = this._operations[opcode];
            this.state.p = (this.state.p + 1) & 0xffff;
            this._pollInterruptsAfterLastInstruction = true;
        }

        if (!operation) {
            if (this._invalidInstructionCallback) {
                this._invalidInstructionCallback(this);
            }

            return;
        }

        this.executionState = CpuInterface.ExecutionState.execute;

        this._lastResult = operation.reset(undefined);
    }

    private _pollInterrupts(): void {
        this.state.irq = false;

        if (this._nmiPending) {
            this.state.nmi = true;
            this._nmiPending = false;

            return;
        }

        if (this._interruptPending && !this.state.nmi && !(this.state.flags & CpuInterface.Flags.i)) {
            this.state.irq = true;
        }
    }

    executionState = CpuInterface.ExecutionState.boot;
    state = new CpuInterface.State();

    private _invalidInstructionCallback: CpuInterface.InvalidInstructionCallbackInterface = null;

    private _lastResult: StateMachineInterface.Result;
    private _interruptPending = false;
    private _nmiPending = false;
    private _halt = false;
    private _pollInterruptsAfterLastInstruction = false;

    private _lastInstructionPointer = 0;

    private _opBoot: StateMachineInterface;
    private _opNmi: StateMachineInterface;
    private _opIrq: StateMachineInterface;
    private _operations = new Array<StateMachineInterface>(255);
}

export default StateMachineCpu;
