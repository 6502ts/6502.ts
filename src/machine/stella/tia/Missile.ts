import Metrics from './Metrics';

class Missile {

    constructor(private _metrics: Metrics) {
        this.reset();
    }

    public reset(): void {
        this.color = 0xFFFFFFFF;
        this._width = 1;
        this.enabled = false;
        this._counter = 0;
        this._rendering = false;
        this._pixelsRendered = 0;
        this._moving = false;
        this._hmmClocks = 0;
    }

    public enam(value: number): void {
        this.enabled = (value & 2) > 0;
    }

    public hmm(value: number): void {
        // Shift and flip the highest bit --- this gives us the necessary movement to the right
        value = value >>> 4;
        this._hmmClocks = ((((~value) & 0xF) >>> 3) << 3) | (value & 0x7);
    }

    public resm(): void {
        this._counter = 0;
    }

    public nusiz(value: number): void {
        this._width = (value & 0x30) >>> 2;
    }

    public startMovement(): void {
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


    public tick(): void {
        if (this._counter === 159) {
            this._rendering = true;
            this._pixelsRendered = 0;
        } else if (this._rendering && ++this._pixelsRendered >= this._width) {
            this._rendering = false;
        }

        if (++this._counter >= 160) {
            this._counter = 0;
        }
    }

    public renderPixel(x: number, y: number, colorIn: number): number {
        if (this._rendering) {
            return this.enabled ? this.color : colorIn;
        }

        return colorIn;
    }

    public color = 0xFFFFFFFF;
    public enabled = false;

    private _hmmClocks = 8;
    private _counter = 0;
    private _moving = false;
    private _width = 1;

    private _rendering = false;
    private _pixelsRendered = 0;

}

export default Missile;
