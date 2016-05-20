import BusInterface from '../bus/BusInterface';
import CpuInterface from '../cpu/CpuInterface';
import TimerInterface from './TimerInterface';
import EventInterface from '../../tools/event/EventInterface';

interface BoardInterface {

    getBus(): BusInterface;

    getCpu(): CpuInterface;

    getTimer(): TimerInterface;

    reset(hard: boolean): BoardInterface;

    boot(): BoardInterface;

    cpuClock: EventInterface<number>;

    clock: EventInterface<number>;

    getClockMode(): BoardInterface.ClockMode;

    setClockMode(clockMode: BoardInterface.ClockMode): BoardInterface;

    trap: EventInterface<BoardInterface.TrapPayload>;

    triggerTrap(reason: BoardInterface.TrapReason, message?: string): BoardInterface;

    getBoardStateDebug(): string;
}

module BoardInterface {

    export const enum TrapReason {cpu, bus, debug, board};

    export const enum ClockMode {instruction, lazy};

    export class TrapPayload {
        constructor(
            public reason: TrapReason,
            public board: BoardInterface,
            public message?: string
        ) {}
    }
}

export default BoardInterface;
