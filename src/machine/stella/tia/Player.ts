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
        this._originalPattern = 0;
        this._pattern = 0;
        this._reflected = false;
        this._delaying = false;
        this._currentPixel = false;
    }

    grp(pattern: number) {
        if (this._delaying) {
            this._originalPatternPending = pattern;
        } else {
            this._originalPattern = pattern;
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

    resp(): void {
        this._counter = 0;
    }

    refp(value: number): void {
        this._reflected = (value & 0x08) > 0;
    }

    vdelp(value: number): void {
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

    render() {
        if (this._rendering && this._renderCounter >= 0 && (this._pattern & (1 << (this._width - this._renderCounter - 1))) > 0) {
            this.collision = this._collisionMask;
            this._currentPixel = true;
        } else {
            this.collision = 0;
            this._currentPixel = false;
        }
    }

    tick(): void {
        if (this._decodes[this._counter]) {
            this._rendering = true;
            this._renderCounter = Count.renderCounterOffset;
        } else if (this._rendering && this._renderCounter++ >= this._width) {
            this._rendering = false;
        }

        if (++this._counter >= 160) {
            this._counter = 0;
        }
    }

    renderPixel(colorIn: number): number {
        return this._currentPixel ? this.color : colorIn;
    }

    shufflePatterns(): void {
        if (this._delaying) {
            this._originalPattern = this._originalPatternPending;
            this._updatePattern();
        }
    }

    private _updatePattern(): void {
        switch (this._width) {
            case 8:
                if (this._reflected) {
                    this._pattern =
                        ((this._originalPattern & 0x01) << 7)  |
                        ((this._originalPattern & 0x02) << 5)  |
                        ((this._originalPattern & 0x04) << 3)  |
                        ((this._originalPattern & 0x08) << 1)  |
                        ((this._originalPattern & 0x10) >>> 1) |
                        ((this._originalPattern & 0x20) >>> 3) |
                        ((this._originalPattern & 0x40) >>> 5) |
                        ((this._originalPattern & 0x80) >>> 7);
                } else {
                    this._pattern = this._originalPattern;
                }
                break;

            case 16:
                if (this._reflected) {
                    this._pattern =
                        ((3 * (this._originalPattern & 0x01)) << 14) |
                        ((3 * (this._originalPattern & 0x02)) << 11) |
                        ((3 * (this._originalPattern & 0x04)) << 8)  |
                        ((3 * (this._originalPattern & 0x08)) << 5)  |
                        ((3 * (this._originalPattern & 0x10)) << 2)  |
                        ((3 * (this._originalPattern & 0x20)) >>> 1) |
                        ((3 * (this._originalPattern & 0x40)) >>> 4) |
                        ((3 * (this._originalPattern & 0x80)) >>> 7);
                } else {
                    this._pattern =
                        ((3 * (this._originalPattern & 0x01)))       |
                        ((3 * (this._originalPattern & 0x02)) << 1)  |
                        ((3 * (this._originalPattern & 0x04)) << 2)  |
                        ((3 * (this._originalPattern & 0x08)) << 3)  |
                        ((3 * (this._originalPattern & 0x10)) << 4)  |
                        ((3 * (this._originalPattern & 0x20)) << 5)  |
                        ((3 * (this._originalPattern & 0x40)) << 6)  |
                        ((3 * (this._originalPattern & 0x80)) << 7);
                }
                break;

            case 32:
                if (this._reflected) {
                    this._pattern =
                        ((0xF * (this._originalPattern & 0x01)) << 28) |
                        ((0xF * (this._originalPattern & 0x02)) << 23) |
                        ((0xF * (this._originalPattern & 0x04)) << 18) |
                        ((0xF * (this._originalPattern & 0x08)) << 13) |
                        ((0xF * (this._originalPattern & 0x10)) << 8)  |
                        ((0xF * (this._originalPattern & 0x20)) << 3)  |
                        ((0xF * (this._originalPattern & 0x40)) >>> 2) |
                        ((0xF * (this._originalPattern & 0x80)) >>> 7);
                } else {
                    this._pattern =
                        ((0xF * (this._originalPattern & 0x01)))       |
                        ((0xF * (this._originalPattern & 0x02)) << 3)  |
                        ((0xF * (this._originalPattern & 0x04)) << 6)  |
                        ((0xF * (this._originalPattern & 0x08)) << 9)  |
                        ((0xF * (this._originalPattern & 0x10)) << 12)  |
                        ((0xF * (this._originalPattern & 0x20)) << 15)  |
                        ((0xF * (this._originalPattern & 0x40)) << 18)  |
                        ((0xF * (this._originalPattern & 0x80)) << 21);
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
    private _currentPixel = false;

    private _decodes: Uint8Array;

    private _originalPattern = 0;
    private _originalPatternPending = 0;
    private _pattern = 0;
    private _reflected = false;
    private _delaying = false;
}
