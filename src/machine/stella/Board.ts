'use strict';

import BoardInterface = require('../board/BoardInterface');
import CpuInterface = require('../cpu/CpuInterface');
import Cpu = require('../cpu/Cpu');
import Bus = require('./Bus');
import BusInterface = require('../bus/BusInterface');
import TimerInterface = require('../board/TimerInterface');
import EventInterface = require('../../tools/event/EventInterface');
import Event = require('../../tools/event/Event');
import SchedulerInterface = require('../../tools/scheduler/SchedulerInterface');
import TaskInterface = require('../../tools/scheduler/TaskInterface');
import Pia = require('./Pia');
import Tia = require('./Tia');
import CartridgeInterface = require('./CartridgeInterface');
import Config = require('./Config');

class Board implements BoardInterface {

    constructor(config: Config, cartridge: CartridgeInterface, cpuFactory?: (bus: BusInterface) => CpuInterface) {
        var bus = new Bus();
        
        if (typeof(cpuFactory) === 'undefined') cpuFactory = bus => new Cpu(bus);

        var cpu = cpuFactory(bus);
        var pia = new Pia();
        var tia = new Tia(config);

        cpu.setInvalidInstructionCallback(() => this._onInvalidInstruction());
        tia.setCpu(this._cpu);
        bus
            .setTia(tia)
            .setPia(pia)
            .setCartridge(cartridge);

        this._bus = bus;
        this._cpu = cpu;
        this._tia = tia;
        this._pia = pia;
        this._cartridge = cartridge;
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

    reset(): Board {
        this._cpu.reset();
        this._tia.reset();
        this._pia.reset();

        return this;
    }

    boot(): Board {
        var clock = 0;

        this.reset();

        if (this._cpu.executionState !== CpuInterface.ExecutionState.boot)
            throw new Error("Already booted!");

        while (this._cpu.executionState !== CpuInterface.ExecutionState.fetch) {
            this._cycle();
            clock++;
        }

        this.clock.dispatch(clock);
        return this;
    }

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
        var sep = "============";

        return  'TIA:\n' +
                sep + '\n' +
                this._tia.getDebugState() + '\n';
    }

    clock = new Event<number>();

    cpuClock = new Event<number>();

    setClockMode(clockMode: BoardInterface.ClockMode): Board {
        this._clockMode = clockMode;

        return this;
    }

    getClockMode(): BoardInterface.ClockMode {
        return this._clockMode;
    }
              
    trap = new Event<BoardInterface.TrapPayload>();

    private _cycle(): void {
        this._pia.cycle();
        this._tia.cycle();
        this._cpu.cycle();
    }

    private _tick(clocks: number): void {
        var i = 0,
            clock = 0;

        this._trap = false;

        while (i++ < clocks && !this._trap) {
            this._cpu.cycle();
            clock++;

            if (this._clockMode === BoardInterface.ClockMode.instruction &&
                this._cpu.executionState === CpuInterface.ExecutionState.fetch &&
                this.clock.hasHandlers
            ) {
                this.clock.dispatch(clock);
                clock = 0;
            }
        }

        if (clock > 0 && this.clock.hasHandlers) this.clock.dispatch(clock);
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

    private _onInvalidInstruction() {
        this.triggerTrap(BoardInterface.TrapReason.cpu, 'invalid instruction');
    }

    private _cpu: CpuInterface;
    private _bus: Bus;
    private _tia: Tia;
    private _pia: Pia;
    private _cartridge: CartridgeInterface;

    private _sliceHint: number;
    private _runTask: TaskInterface;
    private _clockMode = BoardInterface.ClockMode.lazy;
    private _trap = false;

    private _timer = {
        tick: (clocks: number): void => this._tick(clocks),
        start: (scheduler: SchedulerInterface, sliceHint?: number): void => this._start(scheduler, sliceHint),
        stop: (): void => this._stop(),
        isRunning: (): boolean => !!this._runTask 
    };
}

export = Board;
