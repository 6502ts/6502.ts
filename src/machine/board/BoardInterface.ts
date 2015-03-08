'use strict';

import BusInterface = require('../bus/BusInterface');
import CpuInterface = require('../cpu/CpuInterface');
import TimerInterface = require('./TimerInterface');
import EventInterface = require('../../tools/event/EventInterface');

interface BoardInterface {

    getBus(): BusInterface;

    getCpu(): CpuInterface;

    getTimer(): TimerInterface;

    reset(): BoardInterface;

    boot(): BoardInterface;

    cpuClock: EventInterface<number>;

    clock: EventInterface<number>;

    getClockMode(): BoardInterface.ClockMode;

    setClockMode(clockMode: BoardInterface.ClockMode): BoardInterface;

    trap: EventInterface<BoardInterface.TrapPayload>;

    triggerTrap(reason: BoardInterface.TrapReason, error?: Error): BoardInterface;

    getBoardStateDebug(): string;
}

module BoardInterface {
    
    export enum TrapReason {cpu, bus, debug, board};

    export enum ClockMode {instruction, lazy};

    export class TrapPayload {
        constructor(
            public reason: TrapReason,
            public board: BoardInterface,
            public error?: Error
        ) {}
    }
}

export = BoardInterface;
