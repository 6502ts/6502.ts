import BoardInterface from '../board/BoardInterface';
import CpuInterface from '../cpu/CpuInterface';
import Cpu from '../cpu/Cpu';
import Memory from './Memory';
import BusInterface from '../bus/BusInterface';
import TimerInterface from '../board/TimerInterface';
import Event from '../../tools/event/Event';
import SchedulerInterface from '../../tools/scheduler/SchedulerInterface';
import TaskInterface from '../../tools/scheduler/TaskInterface';

class Board implements BoardInterface {

    constructor(cpuFactory?: (bus: BusInterface) => CpuInterface) {
        this.cpuClock = this.clock;

        this._bus = this._createBus();

        if (typeof(cpuFactory) === 'undefined') cpuFactory = bus => new Cpu(bus);

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

        if (hard) {
            this._bus.clear();
        }

        return this;
    }

    boot(): Board {
        let clock = 0;

        if (this._cpu.executionState !== CpuInterface.ExecutionState.boot)
            throw new Error("Already booted!");

        while (this._cpu.executionState !== CpuInterface.ExecutionState.fetch) {
            this._cpu.cycle();
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
        return undefined;
    }

    clock = new Event<number>();

    cpuClock: Event<number>;

    setClockMode(clockMode: BoardInterface.ClockMode): Board {
        this._clockMode = clockMode;

        return this;
    }

    getClockMode(): BoardInterface.ClockMode {
        return this._clockMode;
    }

    trap = new Event<BoardInterface.TrapPayload>();

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

            if (this._clockMode === BoardInterface.ClockMode.instruction &&
                this._cpu.executionState === CpuInterface.ExecutionState.fetch &&
                this.clock.hasHandlers
            ) {
                this.clock.dispatch(clock);
                clock = 0;
            }
        }

        if (clock > 0 && this.clock.hasHandlers) this.clock.dispatch(clock);

        return clock;
    }

    protected _start(scheduler: SchedulerInterface, sliceHint = 100000) {
        if (this._runTask) return;

        this._sliceHint = sliceHint;

        this._runTask = scheduler.start(this._executeSlice, this);
    }

    protected _executeSlice(board: Board) {
        board._tick(board._sliceHint);
    }

    protected _stop() {
        if (!this._runTask) return;

        this._runTask.stop();

        this._runTask = undefined;
    }

    protected _onInvalidInstruction() {
        this.triggerTrap(BoardInterface.TrapReason.cpu, 'invalid instruction');
    }

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

export default Board;
