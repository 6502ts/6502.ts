const enum Count {
    renderCounterOffset = -4
}

export default class Ball {

    constructor(private _collisionMask: number) {
        this.reset();
    }

    reset(): void {
        this.color = 0xFFFFFFFF;
        this.collision = 0;
        this._width = 1;
        this._enabled = false;
        this._counter = 0;
        this._rendering = false;
        this._renderCounter = Count.renderCounterOffset;
        this._moving = false;
        this._hmmClocks = 0;
        this._delaying = false;
        this._enabledPending = false;
    }

    enabl(value: number): void {
        if (this._delaying) {
            this._enabledPending = (value & 2) > 0;
        } else {
            this._enabled = (value & 2) > 0;
        }
    }

    hmbl(value: number): void {
        // Shift and flip the highest bit --- this gives us the necessary movement to the right
        this._hmmClocks = (value >>> 4) ^ 0x8;
    }

    resbl(): void {
        this._counter = 0;
        this._rendering = true;
        this._renderCounter = 0;
    }

    ctrlpf(value: number) {
        this._width = this._widths[(value & 0x30) >>> 4];
    }

    vdelbl(value: number) {
        this._delaying = (value & 0x01) > 0;
    }

    startMovement(): void {
        this._moving = true;
    }

    movementTick(clock: number, apply: boolean): boolean {
        // Stop movement only if the clock matches exactly --- this is crucial for cosmic ark type hacks
        if (clock === this._hmmClocks) {
            this._moving = false;
        }

        if (this._moving && apply) {
            this.render();
            this.tick();
        }

        return this._moving;
    }

    render(): void {
        this.collision = (this._rendering && this._renderCounter >= 0 && this._enabled) ? this._collisionMask : 0;
    }

    tick(): void {
        if (this._counter === 159) {
            this._rendering = true;
            this._renderCounter = Count.renderCounterOffset;
        } else if (this._rendering && ++this._renderCounter >= this._width) {
            this._rendering = false;
        }

        if (++this._counter >= 160) {
            this._counter = 0;
        }
    }

    getPixel(colorIn: number): number {
        return this.collision > 0 ? this.color : colorIn;
    }

    shuffleStatus(): void {
        if (this._delaying) {
            this._enabled = this._enabledPending;
        }
    }

    color = 0xFFFFFFFF;
    collision = 0;

    private _enabled = false;
    private _enabledPending = false;

    private _hmmClocks = 0;
    private _counter = 0;
    private _moving = false;
    private _width = 1;

    private _rendering = false;
    private _renderCounter = Count.renderCounterOffset;

    private _widths = new Uint8Array([1, 2, 4, 8]);

    private _delaying = false;
}
