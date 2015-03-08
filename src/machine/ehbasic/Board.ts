'use strict';

import BoardInterface = require('../board/BoardInterface');
import CpuInterface = require('../cpu/CpuInterface');
import Cpu = require('../cpu/Cpu');
import Memory = require('./Memory');
import BusInterface = require('../bus/BusInterface');
import TimerInterface = require('../board/TimerInterface');
import SimpleSerialIOInterface = require('../io/SimpleSerialIOInterface');
import EventInterface = require('../../tools/event/EventInterface');
import Event = require('../../tools/event/Event');
import SchedulerInterface = require('../../tools/scheduler/SchedulerInterface');
import TaskInterface = require('../../tools/scheduler/TaskInterface');

class Board implements BoardInterface {

    constructor(cpuFactory?: (bus: BusInterface) => CpuInterface) {
        this.cpuClock = this.clock;

        this._memory = new Memory();

        if (typeof(cpuFactory) === 'undefined') cpuFactory = bus => new Cpu(bus);

        this._cpu = cpuFactory(this._memory);
        this._cpu.setInvalidInstructionCallback(() => this._cpuTrap = true);
    }

    getCpu(): CpuInterface {
        return this._cpu;
    }

    getBus(): BusInterface {
        return this._memory;
    }

    getTimer(): TimerInterface {
        return this._timer;
    }

    reset(): Board {
        this._cpu.reset();
        this._memory.clear();
        return this;
    }

    boot(): Board {
        var clock = 0;

        if (this._cpu.executionState !== CpuInterface.ExecutionState.boot)
            throw new Error("Already booted!");

        while (this._cpu.executionState !== CpuInterface.ExecutionState.fetch) {
            this._cpu.cycle();
            clock++;
        }

        this.clock.dispatch(clock);
        return this;
    }

    triggerTrap(reason: BoardInterface.TrapReason, error?: Error): Board {
        this._stop();

        if (this.trap.hasHandlers) {
            this.trap.dispatch(new BoardInterface.TrapPayload(reason, this, error));
        } else {
            throw error;
        }

        return this;
    }

    getBoardStateDebug(): string {
        return undefined;
    }

    getSerialIO(): SimpleSerialIOInterface {
        return this._memory;
    }

    clock = new Event<number>();

    cpuClock: Event<number>;

    trap = new Event<BoardInterface.TrapPayload>();

    private _tick(clocks: number): void {
        var i = 0,
            clock = 0;

        this._cpuTrap = false;

        while (i++ < clocks && !this._cpuTrap) {
            this._cpu.cycle();
            clock++;

            if (this._cpu.executionState === CpuInterface.ExecutionState.fetch && this.clock.hasHandlers) {
                this.clock.dispatch(clock);
                clock = 0;
            }
        }

        if (clock > 0 && this.clock.hasHandlers) this.clock.dispatch(clock);

        if (this._cpuTrap) {
            this.triggerTrap(BoardInterface.TrapReason.cpu, new Error('invalid instruction'));
        }
    }

    private _start(scheduler: SchedulerInterface, sliceHint?: number) {
        if (this._runTask) return;

        this._sliceHint = (typeof(sliceHint) === 'undefined') ? 100000 : sliceHint;

        this._runTask = scheduler.start(this._executeSlice, this);
    }

    private _executeSlice(board: Board) {
        board._tick(board._sliceHint);
    }

    private _stop() {
        if (!this._runTask) return;

        this._runTask.stop();

        this._runTask = undefined;
    }

    private _cpu: CpuInterface;
    private _memory: Memory;
    private _cpuTrap = false;
    private _sliceHint: number;
    private _runTask: TaskInterface;

    private _timer = {
        tick: (clocks: number): void => this._tick(clocks),
        start: (scheduler: SchedulerInterface, sliceHint?: number): void => this._start(scheduler, sliceHint),
        stop: (): void => this._stop(),
        isRunning: (): boolean => !!this._runTask 
    };
}

export = Board;
