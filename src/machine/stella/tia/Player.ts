import Event from '../../../tools/event/Event';
import {decodes} from './drawCounterDecodes';

const enum Count {
    renderCounterOffset = -5
}

export default class Player {

    constructor(private _collisionMask: number) {
        this.reset();
    }

    reset(): void {
        this.color = 0xFFFFFFFF;
        this.collision = 0;
        this._hmmClocks = 0;
        this._counter = 0;
        this._moving = false;
        this._width = 8;
        this._rendering = false;
        this._renderCounter = Count.renderCounterOffset;
        this._decodes = decodes[0];
        this._patternNew = 0;
        this._patternOld = 0;
        this._pattern = 0;
        this._reflected = false;
        this._delaying = false;
    }

    grp(pattern: number) {
        this._patternNew = pattern;
        if (!this._delaying) {
            this._updatePattern();
        }

        this.patternChange.dispatch(undefined);
    }

    nusiz(value: number): void {
        const masked = value & 0x07,
            oldWidth = this._width;

        if (masked === 5) {
            this._width = 16;
        } else if (masked === 7) {
            this._width = 32;
        } else {
            this._width = 8;
        }

        this._decodes = decodes[value & 0x07];

        if (this._rendering && this._renderCounter >= this._width) {
            this._rendering = false;
        }

        if (oldWidth !== this._width) {
            this._updatePattern();
        }
    }

    hmp(value: number): void {
        // Shift and flip the highest bit --- this gives us the necessary movement to the right
        this._hmmClocks = (value >>> 4) ^ 0x8;
    }

    resp(hblank: boolean): void {
        this._counter = hblank ? 159 : 157;
    }

    refp(value: number): void {
        const oldReflected = this._reflected;

        this._reflected = (value & 0x08) > 0;

        if (this._reflected !== oldReflected) {
            this._updatePattern();
        }
    }

    vdelp(value: number): void {
        const oldDelaying = this._delaying;

        this._delaying = (value & 0x01) > 0;

        if (this._delaying !== oldDelaying) {
            this._updatePattern();
        }
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

    render() {
        this.collision = (
            this._rendering &&
            this._renderCounter >= 0 &&
            (this._pattern & (1 << (this._width - this._renderCounter - 1))) > 0
        ) ? this._collisionMask : 0;
    }

    tick(): void {
        let counter = this._width > 8 ? this._counter - 1 : this._counter;

        if (this._decodes[counter]) {
            this._rendering = true;
            this._renderCounter = Count.renderCounterOffset;
        } else if (this._rendering && this._renderCounter++ >= this._width) {
            this._rendering = false;
        }

        if (++this._counter >= 160) {
            this._counter = 0;
        }
    }

    getPixel(colorIn: number): number {
        return this.collision ? this.color : colorIn;
    }

    shufflePatterns(): void {
        const oldPatternOld = this._patternOld;

        this._patternOld = this._patternNew;

        if (this._delaying && oldPatternOld !== this._patternOld) {
            this._updatePattern();
        }
    }

    getRespClock(): number {
        switch (this._width) {
            case 8:
                return this._counter - 3;

            case 16:
                return this._counter - 6;

            case 32:
                return this._counter - 10;

            default:
                throw new Error(`cannot happen: invalid width ${this._width}`);
        }
    }

    private _updatePattern(): void {
        const pattern = this._delaying ? this._patternOld : this._patternNew;

        switch (this._width) {
            case 8:
                if (this._reflected) {
                    this._pattern =
                        ((pattern & 0x01) << 7)  |
                        ((pattern & 0x02) << 5)  |
                        ((pattern & 0x04) << 3)  |
                        ((pattern & 0x08) << 1)  |
                        ((pattern & 0x10) >>> 1) |
                        ((pattern & 0x20) >>> 3) |
                        ((pattern & 0x40) >>> 5) |
                        ((pattern & 0x80) >>> 7);
                } else {
                    this._pattern = pattern;
                }
                break;

            case 16:
                if (this._reflected) {
                    this._pattern =
                        ((3 * (pattern & 0x01)) << 14) |
                        ((3 * (pattern & 0x02)) << 11) |
                        ((3 * (pattern & 0x04)) << 8)  |
                        ((3 * (pattern & 0x08)) << 5)  |
                        ((3 * (pattern & 0x10)) << 2)  |
                        ((3 * (pattern & 0x20)) >>> 1) |
                        ((3 * (pattern & 0x40)) >>> 4) |
                        ((3 * (pattern & 0x80)) >>> 7);
                } else {
                    this._pattern =
                        ((3 * (pattern & 0x01)))       |
                        ((3 * (pattern & 0x02)) << 1)  |
                        ((3 * (pattern & 0x04)) << 2)  |
                        ((3 * (pattern & 0x08)) << 3)  |
                        ((3 * (pattern & 0x10)) << 4)  |
                        ((3 * (pattern & 0x20)) << 5)  |
                        ((3 * (pattern & 0x40)) << 6)  |
                        ((3 * (pattern & 0x80)) << 7);
                }
                break;

            case 32:
                if (this._reflected) {
                    this._pattern =
                        ((0xF * (pattern & 0x01)) << 28) |
                        ((0xF * (pattern & 0x02)) << 23) |
                        ((0xF * (pattern & 0x04)) << 18) |
                        ((0xF * (pattern & 0x08)) << 13) |
                        ((0xF * (pattern & 0x10)) << 8)  |
                        ((0xF * (pattern & 0x20)) << 3)  |
                        ((0xF * (pattern & 0x40)) >>> 2) |
                        ((0xF * (pattern & 0x80)) >>> 7);
                } else {
                    this._pattern =
                        ((0xF * (pattern & 0x01)))       |
                        ((0xF * (pattern & 0x02)) << 3)  |
                        ((0xF * (pattern & 0x04)) << 6)  |
                        ((0xF * (pattern & 0x08)) << 9)  |
                        ((0xF * (pattern & 0x10)) << 12)  |
                        ((0xF * (pattern & 0x20)) << 15)  |
                        ((0xF * (pattern & 0x40)) << 18)  |
                        ((0xF * (pattern & 0x80)) << 21);
                }
                break;
        }
    }

    color = 0xFFFFFFFF;
    collision = 0;
    patternChange = new Event<void>();

    private _hmmClocks = 0;
    private _counter = 0;
    private _moving = false;
    private _width = 8;

    private _rendering = false;
    private _renderCounter = Count.renderCounterOffset;

    private _decodes: Uint8Array;

    private _patternNew = 0;
    private _patternOld = 0;

    private _pattern = 0;
    private _reflected = false;
    private _delaying = false;
}
