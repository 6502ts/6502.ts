/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

import {Event, EventInterface} from 'microevent.ts';

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
            return;
        }

        this._timestamp = Date.now();
        this._counter = 0;
        this._measurementTask = this._scheduler.start(this._updateMeasurement, this);

        return this;
    }

    detach(): ClockProbe {
        if (!this._clock) {
            return;
        }

        this._clock.removeHandler(this._clockHandler, this);
        this._clock = undefined;

        return this;
    }

    stop(): ClockProbe {
        if (!this._measurementTask) {
            return;
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

export default ClockProbe;
