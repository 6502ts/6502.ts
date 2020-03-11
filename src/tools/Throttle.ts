class Throttle<T> {
    constructor(private _interval: number, private _callback: (t: T) => void) {}

    run(data: T): void {
        this._data = data;

        if (this._handle !== null) return;

        const ts = Date.now();

        if (ts - this._lastCall >= this._interval) {
            this._lastCall = ts;
            this._callback(this._data);
        } else {
            this._handle = window.setTimeout(() => {
                this._handle = null;
                this._lastCall = ts;

                this._callback(this._data);
            }, this._interval - ts + this._lastCall);
        }
    }

    private _handle: number = null;
    private _data: T;
    private _lastCall = Date.now();
}

export default Throttle;
