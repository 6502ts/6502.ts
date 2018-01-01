/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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
