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

export default Factory;