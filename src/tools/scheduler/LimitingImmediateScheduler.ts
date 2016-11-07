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

import LimitingSchedulerInterface from './LimitingSchedulerInterface';
import TaskInterface from './TaskInterface';

const CORRECTION_THESHOLD = 3,
    MAX_ACCUMULATED_DELTA = 100;

const getTimestamp = ((self as any).performance && (self as any).performance.now) ?
    () => (self as any).performance.now() :
    () => Date.now();

class LimitingImmediateScheduler implements LimitingSchedulerInterface {

    start<T>(worker: LimitingSchedulerInterface.WorkerInterface<T>, context?: T): TaskInterface {
        let terminate = false,
            targetSleepInterval = -1,
            lastYieldTimestamp = 0,
            accumulatedDelta = 0;

        function handler() {
            if (terminate) return;

            const timestamp0 = getTimestamp(),
                targetDuration = worker(context),
                timestamp1 = getTimestamp();

            let delay = targetDuration - timestamp1 + timestamp0;

            if (targetSleepInterval >= 0) {
                accumulatedDelta += (targetSleepInterval - timestamp0 + lastYieldTimestamp);
            }

            if (accumulatedDelta > MAX_ACCUMULATED_DELTA) {
                accumulatedDelta = MAX_ACCUMULATED_DELTA;
            } else if (accumulatedDelta < - MAX_ACCUMULATED_DELTA) {
                accumulatedDelta = - MAX_ACCUMULATED_DELTA;
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
                polyfill.setImmediate(handler);
            }

            targetSleepInterval = delay;
            lastYieldTimestamp = getTimestamp();
        }

        polyfill.setImmediate(handler);

        return {
            stop: () => terminate = true
        };
    }
}

export default LimitingImmediateScheduler;
