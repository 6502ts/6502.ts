import Metrics from './Metrics';

class Missile {

    constructor(private _metrics: Metrics) {
        this.reset();
    }

    public reset() {
        this.color = 0xFFFFFFFF;
        this.width = 1;
        this.enabled = true;
        this._counter = 0;
        this._rendering = false;
        this._pixelsRendered = 0;
        this._moving = false;
        this._hmmClocks = 8;
    }

    public newLine() {
        // Stop rendering if a line ends, but allow positioning at x = 0
        if (this._rendering && this._pixelsRendered > 0) {
            this._rendering = false;
        }
    }

    public enam(value: number) {
        this.enabled = (value & 2) > 0;
    }

    public hmm(value: number) {
        // Shift and flip the highest bit --- this gives us the necessary movement to the right
        value = value >>> 4;
        this._hmmClocks = ((((~value) & 0xF) >>> 3) << 3) | (value & 0x7);
    }

    public startMovement() {
        this._moving = true;
    }

    public movementTick(clock: number, apply: boolean): boolean {
        // Stop movement only if the clock matches exactly --- this is crucial for cosmic ark type hacks
        if (clock === this._hmmClocks) {
            this._moving = false;
        }

        if (this._moving && apply) {
            this.tick();
        }

        return this._moving;
    }


    public tick() {
        // Start rendering if the counter overflows. Order matters: we start rendering
        // now and will render the first pixel in the next cycle.
        if (++this._counter >= this._metrics.visibleWidth) {
            this._counter = 0;
            this._rendering = true;
            this._pixelsRendered = 0;
        } else if (this._rendering && ++this._pixelsRendered >= this.width) {
            this._rendering = false;
        }
    }

    public renderPixel(x: number, y: number, colorIn: number): number {
        if (this._rendering) {
            return this.enabled ? this.color : colorIn;
        }

        return colorIn;
    }

    public color = 0xFFFFFFFF;
    public width = 1;
    public enabled = false;

    private _hmmClocks = 8;
    private _counter = 0;
    private _moving = false;

    private _rendering = false;
    private _pixelsRendered = 0;

}

export default Missile;
