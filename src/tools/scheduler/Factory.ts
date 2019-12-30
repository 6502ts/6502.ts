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

import SchedulerInterface from './SchedulerInterface';
import PeriodicScheduler from './PeriodicScheduler';
import ImmediateScheduler from './ImmedateScheduler';

import BusyWaitScheduler from './limiting/BusyWait';
import ConstantCyclesScheduler from './limiting/ConstantCycles';
import ConstantTimesliceScheduler from './limiting/ConstantTimeslice';

class Factory {
    createPeriodicScheduler(period: number): PeriodicScheduler {
        return new PeriodicScheduler(period);
    }

    createImmediateScheduler(): SchedulerInterface {
        return new ImmediateScheduler();
    }

    createLimitingScheduler(strategy = Factory.LimitingSchedulingStrategy.constantCycles) {
        switch (strategy) {
            case Factory.LimitingSchedulingStrategy.busyWait:
                return new BusyWaitScheduler();

            case Factory.LimitingSchedulingStrategy.constantCycles:
                return new ConstantCyclesScheduler();

            case Factory.LimitingSchedulingStrategy.constantTimeslice:
                return new ConstantTimesliceScheduler();

            default:
                throw new Error('invalud limiting scheduling strategy');
        }
    }

    getLimitingSchedulingStrategies(): Array<Factory.LimitingSchedulingStrategy> {
        return [
            Factory.LimitingSchedulingStrategy.busyWait,
            Factory.LimitingSchedulingStrategy.constantCycles,
            Factory.LimitingSchedulingStrategy.constantTimeslice
        ];
    }

    describeLimitingSchedulingStrategy(strategy: Factory.LimitingSchedulingStrategy): string {
        switch (strategy) {
            case Factory.LimitingSchedulingStrategy.busyWait:
                return 'Busy wait, constant timeslice length';

            case Factory.LimitingSchedulingStrategy.constantCycles:
                return 'Constant cycle count';

            case Factory.LimitingSchedulingStrategy.constantTimeslice:
                return 'Constant timeslice length';

            default:
                throw new Error('invalid limiting scheduling strategy');
        }
    }
}

namespace Factory {
    export const enum LimitingSchedulingStrategy {
        busyWait,
        constantCycles,
        constantTimeslice
    }
}

export { Factory as default };
