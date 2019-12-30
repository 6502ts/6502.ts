/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

const enum Count {
    renderCounterOffset = -4
}

export default class Ball {
    constructor(private _collisionMask: number, private _flushLineCache: () => void) {
        this.reset();
    }

    reset(): void {
        this.color = 0xffffffff;
        this.collision = 0;
        this._width = 1;
        this._enabledOld = false;
        this._enabledNew = false;
        this._enabled = false;
        this._counter = 0;
        this._rendering = false;
        this._renderCounter = Count.renderCounterOffset;
        this._moving = false;
        this._hmmClocks = 0;
        this._delaying = false;
        this._effectiveWidth = 0;
        this._lastMovementTick = 0;
    }

    enabl(value: number): void {
        const enabledNewOldValue = this._enabledNew;

        this._enabledNew = (value & 2) > 0;

        if (enabledNewOldValue !== this._enabledNew && !this._delaying) {
            this._flushLineCache();
            this._updateEnabled();
        }
    }

    hmbl(value: number): void {
        // Shift and flip the highest bit --- this gives us the necessary movement to the right
        this._hmmClocks = (value >>> 4) ^ 0x8;
    }

    resbl(counter: number): void {
        this._counter = counter;

        this._rendering = true;
        this._renderCounter = Count.renderCounterOffset + (counter - 157);
    }

    ctrlpf(value: number): void {
        const width = this._widths[(value & 0x30) >>> 4];

        if (width !== this._width) {
            this._flushLineCache();
        }

        this._width = width;
    }

    vdelbl(value: number): void {
        const oldDelaying = this._delaying;

        this._delaying = (value & 0x01) > 0;

        if (oldDelaying !== this._delaying) {
            this._flushLineCache();
            this._updateEnabled();
        }
    }

    startMovement(): void {
        this._moving = true;
    }

    movementTick(clock: number, apply: boolean): boolean {
        this._lastMovementTick = this._counter;

        // Stop movement only if the clock matches exactly --- this is crucial for cosmic ark type hacks
        if (clock === this._hmmClocks) {
            this._moving = false;
        }

        if (this._moving && apply) {
            this.tick(false);
        }

        return this._moving;
    }

    tick(isReceivingHclock: boolean): void {
        this.collision = this._rendering && this._renderCounter >= 0 && this._enabled ? 0 : this._collisionMask;

        const starfieldEffect = this._moving && isReceivingHclock;

        if (this._counter === 156) {
            const starfieldDelta = (this._counter - this._lastMovementTick + 160) % 4;

            this._rendering = true;
            this._renderCounter = Count.renderCounterOffset;

            if (starfieldEffect && starfieldDelta === 3 && this._width < 4) {
                this._renderCounter++;
            }

            switch (starfieldDelta) {
                case 3:
                    this._effectiveWidth = this._width === 1 ? 2 : this._width;
                    break;

                case 2:
                    this._effectiveWidth = 0;
                    break;

                default:
                    this._effectiveWidth = this._width;
                    break;
            }
        } else if (this._rendering && ++this._renderCounter >= (starfieldEffect ? this._effectiveWidth : this._width)) {
            this._rendering = false;
        }

        if (++this._counter >= 160) {
            this._counter = 0;
        }
    }

    getPixel(colorIn: number): number {
        return this.collision ? colorIn : this.color;
    }

    shuffleStatus(): void {
        const oldEnabledOld = this._enabledOld;

        this._enabledOld = this._enabledNew;

        if (this._delaying && this._enabledOld !== oldEnabledOld) {
            this._flushLineCache();
            this._updateEnabled();
        }
    }

    setColor(color: number): void {
        if (color !== this.color && this._enabled) {
            this._flushLineCache();
        }

        this.color = color;
    }

    private _updateEnabled(): void {
        this._enabled = this._delaying ? this._enabledOld : this._enabledNew;
    }

    color = 0xffffffff;
    collision = 0;

    private _enabledOld = false;
    private _enabledNew = false;
    private _enabled = false;

    private _hmmClocks = 0;
    private _counter = 0;
    private _moving = false;
    private _width = 1;
    private _effectiveWidth = 0;
    private _lastMovementTick = 0;

    private _rendering = false;
    private _renderCounter = Count.renderCounterOffset;

    private _widths = new Uint8Array([1, 2, 4, 8]);

    private _delaying = false;
}
