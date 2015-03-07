import EventInterface = require('./event/EventInterface');
import Event = require('./event/Event');
import SchedulerInterface = require('./scheduler/SchedulerInterface');

class ClockProbe {

    constructor(private _scheduler: SchedulerInterface) {}

    attach(clock: EventInterface<any>): ClockProbe {
        if (this._clock) this.detach();

        this._clock = clock;
        clock.addHandler(this._clockHandler, this);

        return this;
    }

    start(): ClockProbe {
        if (this._mesurementTerminator) return;

        this._timestamp = Date.now();
        this._counter = 0;
        this._mesurementTerminator = this._scheduler.start(this._updateMeasurement, this);

        return this;
    }

    detach(): ClockProbe {
        if (!this._clock) return;

        this._clock.removeHandler(this._clockHandler, this);
        this._clock = null;

        return this;
    }

    stop(): ClockProbe {
        if (!this._mesurementTerminator) return;

        this._mesurementTerminator();
        this._mesurementTerminator = null;

        return this;
    }

    getFrequency(): number {
        return this._frequency;
    }

    frequencyUpdate = new Event<number>();

    private _updateMeasurement(probe: ClockProbe) {
        var timestamp = Date.now();

        probe._frequency = probe._counter / (timestamp - probe._timestamp) * 1000;

        probe._counter = 0;
        probe._timestamp = timestamp;

        probe.frequencyUpdate.dispatch(probe._frequency);
    }

    private _clockHandler(payload: any, ctx: ClockProbe) {
        ctx._counter++;
    }

    private _counter = 0;
    private _timestamp: number;
    private _frequency = 0;
    
    private _clock: EventInterface<any>;

    private _mesurementTerminator: SchedulerInterface.TerminatorInterface;
}

export = ClockProbe;
