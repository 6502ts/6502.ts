import SchedulerInterface = require('./SchedulerInterface');
import TaskInterface = require('./TaskInterface');

class PeriodicScheduler implements SchedulerInterface {

    constructor(private _period: number) {}

    setPeriod(period: number): PeriodicScheduler {
        this._period = period;

        return this;
    }

    getPeriod(): number {
        return this._period;
    }

    start<T>(worker: SchedulerInterface.WorkerInterface<T>, context?: T): TaskInterface {
        let terminate = false;

        const handler = () => {
            if (terminate) return;

            worker(context);

            setTimeout(handler, this._period);
        };

        setTimeout(handler, this._period);

        return {
            stop: () => terminate = true
        };
    }
}

export = PeriodicScheduler;
