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

const CORRECTION_THESHOLD = 3,
    MAX_ACCUMULATED_DELTA = 100;

class ConstantCyclesScheduler implements SchedulerInterface {
    start<T>(worker: SchedulerInterface.WorkerInterface<T>, context?: T): TaskInterface {
        let terminate = false,
            targetSleepInterval = -1,
            lastYieldTimestamp = 0,
            accumulatedDelta = 0;

        function handler() {
            if (terminate) {
                return;
            }

            const timestamp0 = getTimestamp(),
                targetDuration = worker(context) || 0,
                timestamp1 = getTimestamp();

            let delay = targetDuration - timestamp1 + timestamp0;

            if (targetSleepInterval >= 0) {
                accumulatedDelta += targetSleepInterval - timestamp0 + lastYieldTimestamp;
            }

            if (accumulatedDelta > MAX_ACCUMULATED_DELTA) {
                accumulatedDelta = MAX_ACCUMULATED_DELTA;
            } else if (accumulatedDelta < -MAX_ACCUMULATED_DELTA) {
                accumulatedDelta = -MAX_ACCUMULATED_DELTA;
            }

            if (Math.abs(accumulatedDelta) > CORRECTION_THESHOLD) {
                delay += accumulatedDelta;
                accumulatedDelta = 0;
            }

            if (delay < 0) {
                delay = 0;
                accumulatedDelta = delay;
            }

            if (delay > 0) {
                setTimeout(handler, Math.round(delay));
            } else {
                setImmediate(handler);
            }

            targetSleepInterval = delay;
            lastYieldTimestamp = getTimestamp();
        }

        setImmediate(handler);

        return {
            stop: () => (terminate = true)
        };
    }
}

export { ConstantCyclesScheduler as default };
