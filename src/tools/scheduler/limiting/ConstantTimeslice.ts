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

import SchedulerInterface from '../SchedulerInterface';
import TaskInterface from '../TaskInterface';
import getTimestamp from '../getTimestamp';
import { setImmediate } from '../setImmediate';

const SAFETY_FACTOR = 3;

class ConstantTimesliceScheduler implements SchedulerInterface {
    start<T>(worker: SchedulerInterface.WorkerInterface<T>, context?: T, _timeSlice?: number): TaskInterface {
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

            const timeToSleep = timeSlice - getTimestamp() + timestamp;

            if (timeToSleep > 0) {
                setTimeout(handler, timeToSleep);
            } else {
                setImmediate(handler);
            }
        }

        setImmediate(handler);

        return { stop: () => (running = false) };
    }
}

export { ConstantTimesliceScheduler as default };
