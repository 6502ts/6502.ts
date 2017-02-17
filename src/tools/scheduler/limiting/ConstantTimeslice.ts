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

import * as polyfill from 'setimmediate2';

import SchedulerInterface from '../SchedulerInterface';
import TaskInterface from '../TaskInterface';
import getTimestamp from '../getTimestamp';

const SAFETY_FACTOR = 3;

class ConstantTimesliceScheduler implements SchedulerInterface {

    start<T>(
        worker: SchedulerInterface.WorkerInterface<T>,
        context?: T,
        _timeSlice?: number
    ): TaskInterface {
        const timeSlice = _timeSlice || 100;

        let timestamp0 = getTimestamp(),
            emulationTime = 0,
            running = true;

        function handler() {
            if (!running) {
                return;
            }

            const timestamp = getTimestamp();
            let delta = timestamp - timestamp0 - emulationTime;

            if (delta > SAFETY_FACTOR * timeSlice) {
                delta = SAFETY_FACTOR * timeSlice;
                timestamp0 = timestamp - delta;
                emulationTime = 0;
            }

            emulationTime += worker(context, delta) as number;

            const timeToSleep = _timeSlice - getTimestamp() + timestamp;

            if (timeToSleep > 0) {
                setTimeout(handler, timeToSleep);
            } else {
                polyfill.setImmediate(handler);
            }
        }

        polyfill.setImmediate(handler);

        return {stop: () => running = false};

    }

}

export default ConstantTimesliceScheduler;