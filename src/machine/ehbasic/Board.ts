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
        if (this._cpu.executionState !== CpuInterface.ExecutionState.boot)
            throw new Error("Already booted!");

        while (this._cpu.executionState !== CpuInterface.ExecutionState.fetch) {
            this._cpu.cycle();
            this.cpuClock.dispatch(undefined);
        }

        return this;
    }

    triggerTrap(reason: BoardInterface.TrapReason, error?: Error): Board {
        this._stop();

        if (this.trap.hasHandlers()) {
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

    clock = new Event<void>();

    cpuClock: Event<void>;

    trap = new Event<BoardInterface.TrapPayload>();

    private _tick(clocks: number): void {
        var clock = 0;

        this._cpuTrap = false;

        while (clock++ < clocks && !this._cpuTrap) {
            this._cpu.cycle();
            this.clock.dispatch(undefined);
        }

        if (this._cpuTrap) {
            this.triggerTrap(BoardInterface.TrapReason.cpu, new Error('invalid instruction'));
        }
    }

    private _step(instructions: number): void {
        if (this._terminateSchedulerCallback) throw new Error(
            'Cannot step while clock is running!');

        var instruction = 0;

        this._cpuTrap = false;

        while (instruction++ < instructions && !this._cpuTrap) {
            do {
                this._cpu.cycle();
                this.clock.dispatch(undefined);
            } while (this._cpu.executionState !== CpuInterface.ExecutionState.fetch);
        }

        if (this._cpuTrap) {
            this.triggerTrap(BoardInterface.TrapReason.cpu, new Error('invalid instruction'));
        }
    }

    private _start(scheduler: SchedulerInterface, sliceHint?: number) {
        if (this._terminateSchedulerCallback) return;

        if (typeof(sliceHint) === 'undefined') sliceHint = 100000;

        this._terminateSchedulerCallback = scheduler.start(() => this._step(sliceHint));
    }

    private _stop() {
        if (!this._terminateSchedulerCallback) return;

        this._terminateSchedulerCallback();

        this._terminateSchedulerCallback = undefined;
    }

    private _cpu: CpuInterface;
    private _memory: Memory;
    private _cpuTrap = false;
    private _terminateSchedulerCallback: SchedulerInterface.TerminatorInterface = undefined;

    private _timer = {
        tick: (clocks: number): void => this._tick(clocks),
        step: (instructions: number): void => this._step(instructions),
        start: (scheduler: SchedulerInterface, sliceHint?: number): void => this._start(scheduler),
        stop: (): void => this._stop(),
        isRunning: (): boolean => !!this._terminateSchedulerCallback 
    };
}

export = Board;
