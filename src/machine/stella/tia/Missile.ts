import {decodes} from './drawCounterDecodes';

class Missile {

    constructor() {
        this.reset();
    }

    public reset(): void {
        this.color = 0xFFFFFFFF;
        this._width = 1;
        this.enabled = false;
        this._counter = 0;
        this._rendering = false;
        this._renderCounter = -3;
        this._moving = false;
        this._hmmClocks = 0;
        this._decodes = decodes[0];
    }

    public enam(value: number): void {
        this.enabled = (value & 2) > 0;
    }

    public hmm(value: number): void {
        // Shift and flip the highest bit --- this gives us the necessary movement to the right
        this._hmmClocks = (value >>> 4) ^ 0x8;
    }

    public resm(): void {
        this._counter = 0;
    }

    public nusiz(value: number): void {
        this._width = this._widths[(value & 0x30) >>> 4];
        this._decodes = decodes[value & 0x07];

        if (this._rendering && this._renderCounter >= this._width) {
            this._rendering = false;
        }
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
        if (this._decodes[this._counter]) {
            this._rendering = true;
            this._renderCounter = -3;
        } else if (this._rendering && ++this._renderCounter >= this._width) {
            this._rendering = false;
        }

        if (++this._counter >= 160) {
            this._counter = 0;
        }
    }

    public renderPixel(x: number, y: number, colorIn: number): number {
        if (this._rendering && this._renderCounter >= 0) {
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
    private _renderCounter = -3;

    private _decodes: Uint8Array;
    private _widths = new Uint8Array([1, 2, 4, 8]);
}

export default Missile;
