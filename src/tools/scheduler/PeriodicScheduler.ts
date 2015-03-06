import SchedulerInterface = require('./SchedulerInterface');

class PeriodicScheduler implements SchedulerInterface {

    constructor(private _period: number) {}

    setPeriod(period: number): PeriodicScheduler {
        this._period = period;

        return this;
    }

    getPeriod(): number {
        return this._period;
    }

    start(worker: SchedulerInterface.WorkerInterface): SchedulerInterface.TerminatorInterface {
        var terminate = false;

        var handler = () => {
            if (terminate) return;

            worker();

            setTimeout(handler, this._period);
        }

        setTimeout(handler, this._period);

        return () => terminate = true;
    }
}

export = PeriodicScheduler;
