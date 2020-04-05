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

import { decodesMissile } from './drawCounterDecodes';

import Player from './Player';

const enum Count {
    renderCounterOffset = -4
}

class Missile {
    constructor(private _collisionMask: number, private _flushLineCache: () => void) {
        this.reset();
    }

    reset(): void {
        this.color = 0xffffffff;
        this._width = 1;
        this._enabled = false;
        this._counter = 0;
        this._rendering = false;
        this._renderCounter = Count.renderCounterOffset;
        this._moving = false;
        this._hmmClocks = 0;
        this._decodes = decodesMissile[0];
        this._resmp = 0;
        this._enam = false;
        this._effectiveWidth = 0;
        this._lastMovementTick = 0;
    }

    enam(value: number): void {
        const enam = (value & 2) > 0,
            enabled = enam && this._resmp === 0;

        if (enam !== this._enam || enabled !== this._enabled) {
            this._flushLineCache();
        }

        this._enam = enam;
        this._enabled = enabled;
    }

    hmm(value: number): void {
        // Shift and flip the highest bit --- this gives us the necessary movement to the right
        this._hmmClocks = (value >>> 4) ^ 0x8;
    }

    resm(counter: number, hblank: boolean): void {
        this._counter = counter;

        if (this._rendering) {
            if (this._renderCounter < 0) {
                this._renderCounter = Count.renderCounterOffset + (counter - 157);
            } else {
                switch (this._width) {
                    case 8:
                        this._renderCounter = counter - 157 + (this._renderCounter >= 4 ? 4 : 0);
                        break;

                    case 4:
                        this._renderCounter = counter - 157;
                        break;

                    case 2:
                        if (hblank) {
                            this._rendering = this._renderCounter > 1;
                        } else if (this._renderCounter === 0) {
                            this._renderCounter++;
                        }

                        break;

                    default:
                        if (hblank) {
                            this._rendering = this._renderCounter > 0;
                        }

                        break;
                }
            }
        }
    }

    resmp(value: number, player: Player) {
        const resmp = value & 0x02;

        if (resmp === this._resmp) {
            return;
        }

        this._flushLineCache();

        this._resmp = resmp;

        if (resmp) {
            this._enabled = false;
        } else {
            this._enabled = this._enam;
            this._counter = player.getRespClock();
        }
    }

    nusiz(value: number): void {
        this._width = this._widths[(value & 0x30) >>> 4];
        this._decodes = decodesMissile[value & 0x07];

        if (this._rendering && this._renderCounter >= this._width) {
            this._rendering = false;
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

        if (this._decodes[this._counter] && !this._resmp) {
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

    setColor(color: number): void {
        if (color !== this.color && this._enabled) {
            this._flushLineCache();
        }

        this.color = color;
    }

    color = 0xffffffff;
    collision = 0;

    private _enabled = false;
    private _enam = false;
    private _resmp = -1;

    private _hmmClocks = 0;
    private _counter = 0;
    private _moving = false;
    private _width = 1;
    private _effectiveWidth = 0;
    private _lastMovementTick = 0;

    private _rendering = false;
    private _renderCounter = Count.renderCounterOffset;

    private _decodes: Uint8Array;
    private _widths = new Uint8Array([1, 2, 4, 8]);
}

export { Missile as default };
