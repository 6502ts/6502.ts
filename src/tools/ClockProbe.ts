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

import { Event, EventInterface } from 'microevent.ts';

import SchedulerInterface from './scheduler/SchedulerInterface';
import TaskInterface from './scheduler/TaskInterface';

class ClockProbe {
    constructor(private _scheduler: SchedulerInterface) {}

    attach(clock: EventInterface<any>): ClockProbe {
        if (this._clock) {
            this.detach();
        }

        this._clock = clock;
        clock.addHandler(this._clockHandler, this);

        return this;
    }

    start(): ClockProbe {
        if (this._measurementTask) {
            return this;
        }

        this._timestamp = Date.now();
        this._counter = 0;
        this._measurementTask = this._scheduler.start(this._updateMeasurement, this);

        return this;
    }

    detach(): ClockProbe {
        if (!this._clock) {
            return this;
        }

        this._clock.removeHandler(this._clockHandler, this);
        this._clock = undefined;

        return this;
    }

    stop(): ClockProbe {
        if (!this._measurementTask) {
            return this;
        }

        this._measurementTask.stop();
        this._measurementTask = undefined;

        return this;
    }

    getFrequency(): number {
        return this._frequency;
    }

    private _updateMeasurement(probe: ClockProbe) {
        const timestamp = Date.now();

        probe._frequency = probe._counter / (timestamp - probe._timestamp) * 1000;

        probe._counter = 0;
        probe._timestamp = timestamp;

        probe.frequencyUpdate.dispatch(probe._frequency);
    }

    private _clockHandler(clocks: number, ctx: ClockProbe) {
        ctx._counter += clocks;
    }

    frequencyUpdate = new Event<number>();

    private _counter = 0;
    private _timestamp: number;
    private _frequency = 0;

    private _clock: EventInterface<any>;

    private _measurementTask: TaskInterface;
}

export { ClockProbe as default };
