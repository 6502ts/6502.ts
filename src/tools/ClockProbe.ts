import EventInterface from './event/EventInterface';
import Event from './event/Event';
import SchedulerInterface from './scheduler/SchedulerInterface';
import TaskInterface from './scheduler/TaskInterface';

class ClockProbe {

    constructor(private _scheduler: SchedulerInterface) {}

    attach(clock: EventInterface<any>): ClockProbe {
        if (this._clock) this.detach();

        this._clock = clock;
        clock.addHandler(this._clockHandler, this);

        return this;
    }

    start(): ClockProbe {
        if (this._measurementTask) return;

        this._timestamp = Date.now();
        this._counter = 0;
        this._measurementTask = this._scheduler.start(this._updateMeasurement, this);

        return this;
    }

    detach(): ClockProbe {
        if (!this._clock) return;

        this._clock.removeHandler(this._clockHandler, this);
        this._clock = undefined;

        return this;
    }

    stop(): ClockProbe {
        if (!this._measurementTask) return;

        this._measurementTask.stop();
        this._measurementTask = undefined;

        return this;
    }

    getFrequency(): number {
        return this._frequency;
    }

    frequencyUpdate = new Event<number>();

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

    private _counter = 0;
    private _timestamp: number;
    private _frequency = 0;

    private _clock: EventInterface<any>;

    private _measurementTask: TaskInterface;
}

export default ClockProbe;
