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

import { Event } from 'microevent.ts';

import BoardInterface from '../board/BoardInterface';
import CpuInterface from '../cpu/CpuInterface';
import Cpu from '../cpu/StateMachineCpu';
import Memory from './Memory';
import BusInterface from '../bus/BusInterface';
import TimerInterface from '../board/TimerInterface';
import SchedulerInterface from '../../tools/scheduler/SchedulerInterface';
import TaskInterface from '../../tools/scheduler/TaskInterface';

class Board implements BoardInterface {
    constructor(cpuFactory?: (bus: BusInterface) => CpuInterface) {
        this.cpuClock = this.clock;

        this._bus = this._createBus();

        if (typeof cpuFactory === 'undefined') {
            cpuFactory = bus => new Cpu(bus);
        }

        this._cpu = cpuFactory(this._bus);
        this._cpu.setInvalidInstructionCallback(() => this._onInvalidInstruction());
    }

    getCpu(): CpuInterface {
        return this._cpu;
    }

    getBus(): BusInterface {
        return this._bus;
    }

    getTimer(): TimerInterface {
        return this._timer;
    }

    reset(hard: boolean): Board {
        this._cpu.reset();
        this._bus.reset();

        if (hard) {
            this._bus.clear();
        }

        return this;
    }

    boot(): Board {
        let clock = 0;

        if (this._cpu.executionState !== CpuInterface.ExecutionState.boot) {
            throw new Error('Already booted!');
        }

        while ((this._cpu.executionState as CpuInterface.ExecutionState) !== CpuInterface.ExecutionState.fetch) {
            this._cpu.cycle();
            clock++;
        }

        this.clock.dispatch(clock);
        return this;
    }

    suspend(): void {}

    resume(): void {}

    triggerTrap(reason: BoardInterface.TrapReason, message?: string): Board {
        this._stop();

        this._trap = true;

        if (this.trap.hasHandlers) {
            this.trap.dispatch(new BoardInterface.TrapPayload(reason, this, message));
        } else {
            throw new Error(message);
        }

        return this;
    }

    getBoardStateDebug(): string {
        return undefined;
    }

    setClockMode(clockMode: BoardInterface.ClockMode): Board {
        this._clockMode = clockMode;

        return this;
    }

    getClockMode(): BoardInterface.ClockMode {
        return this._clockMode;
    }

    protected _createBus() {
        return new Memory();
    }

    protected _tick(clocks: number): number {
        let i = 0,
            clock = 0;

        this._trap = false;

        while (i++ < clocks && !this._trap) {
            this._cpu.cycle();
            clock++;

            if (
                this._clockMode === BoardInterface.ClockMode.instruction &&
                this._cpu.executionState === CpuInterface.ExecutionState.fetch &&
                this.clock.hasHandlers
            ) {
                this.clock.dispatch(clock);
                clock = 0;
            }
        }

        if (clock > 0 && this.clock.hasHandlers) {
            this.clock.dispatch(clock);
        }

        return clock;
    }

    protected _start(scheduler: SchedulerInterface, sliceHint = 100000) {
        if (this._runTask) {
            return;
        }

        this._sliceHint = sliceHint;

        this._runTask = scheduler.start(this._executeSlice, this);
    }

    protected _executeSlice(board: Board) {
        board._tick(board._sliceHint);
    }

    protected _stop() {
        if (!this._runTask) {
            return;
        }

        this._runTask.stop();

        this._runTask = undefined;
    }

    protected _onInvalidInstruction() {
        this.triggerTrap(BoardInterface.TrapReason.cpu, 'invalid instruction');
    }

    clock = new Event<number>();

    cpuClock: Event<number>;

    trap = new Event<BoardInterface.TrapPayload>();

    protected _cpu: CpuInterface;
    protected _bus: Memory;
    protected _trap = false;
    protected _sliceHint: number;
    protected _runTask: TaskInterface;
    protected _clockMode = BoardInterface.ClockMode.lazy;

    protected _timer = {
        tick: (clocks: number): number => this._tick(clocks),
        start: (scheduler: SchedulerInterface, sliceHint?: number): void => this._start(scheduler, sliceHint),
        stop: (): void => this._stop(),
        isRunning: (): boolean => !!this._runTask
    };
}

export { Board as default };
