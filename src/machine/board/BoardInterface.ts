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

import { EventInterface } from 'microevent.ts';

import BusInterface from '../bus/BusInterface';
import CpuInterface from '../cpu/CpuInterface';
import TimerInterface from './TimerInterface';

interface BoardInterface {
    getBus(): BusInterface;

    getCpu(): CpuInterface;

    getTimer(): TimerInterface;

    reset(hard: boolean): BoardInterface;

    boot(): BoardInterface;

    suspend(): void;

    resume(): void;

    getClockMode(): BoardInterface.ClockMode;

    setClockMode(clockMode: BoardInterface.ClockMode): BoardInterface;

    triggerTrap(reason: BoardInterface.TrapReason, message?: string): BoardInterface;

    getBoardStateDebug(): string;

    trap: EventInterface<BoardInterface.TrapPayload>;

    cpuClock: EventInterface<number>;

    clock: EventInterface<number>;

    systemReset: EventInterface<void>;
}

namespace BoardInterface {
    export const enum TrapReason {
        cpu,
        bus,
        debug,
        board
    }

    export const enum ClockMode {
        instruction,
        lazy
    }

    export class TrapPayload {
        constructor(public reason: TrapReason, public board: BoardInterface, public message?: string) {}
    }
}

export { BoardInterface as default };
