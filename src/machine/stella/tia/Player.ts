/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import {decodesPlayer} from './drawCounterDecodes';

const enum Count {
    renderCounterOffset = -5,
}

export default class Player {

    constructor(
        private _collisionMask: number,
        private _lineCacheViolated: () => void
    ) {
        this.reset();
    }

    reset(): void {
        this.color = 0xFFFFFFFF;
        this.collision = 0;
        this._hmmClocks = 0;
        this._counter = 0;
        this._moving = false;
        this._rendering = false;
        this._renderCounter = Count.renderCounterOffset;
        this._decodes = decodesPlayer[0];
        this._patternNew = 0;
        this._patternOld = 0;
        this._pattern = 0;
        this._reflected = false;
        this._delaying = false;
        this._sampleCounter = 0;
        this._dividerPending = 0;
        this._dividerChangeCounter = -1;

        this._setDivider(1);
    }

    grp(pattern: number) {
        if (pattern === this._patternNew) {
            return;
        }

        this._patternNew = pattern;

        if (!this._delaying) {
            this._lineCacheViolated();
            this._updatePattern();
        }
    }

    hmp(value: number): void {
        this._hmmClocks = (value >>> 4) ^ 0x8;
    }

    nusiz(value: number, hblank: boolean): void {
        const masked = value & 0x07;

        switch (masked) {
            case 5:
                this._dividerPending = 2;
                break;

            case 7:
                this._dividerPending = 4;
                break;

            default:
                this._dividerPending = 1;
        }

        const oldDecodes = this._decodes;

        this._decodes = decodesPlayer[masked];

        if (
            this._decodes !== oldDecodes &&
            this._rendering &&
            (this._renderCounter - Count.renderCounterOffset) < 2 &&
            !this._decodes[(this._counter - this._renderCounter + Count.renderCounterOffset + 159) % 160]
        ) {
            this._rendering = false;
        }

        if (this._dividerPending === this._divider) {
            return;
        }

        if (!this._rendering) {
            this._setDivider(this._dividerPending);
            return;
        }

        const delta = this._renderCounter - Count.renderCounterOffset;

        switch (this._divider << 4 | this._dividerPending) {
            case 0x12:
            case 0x14:
                if (hblank) {
                    if (delta < 4) {
                        this._setDivider(this._dividerPending);
                    } else {
                        this._dividerChangeCounter = (delta < 5 ? 1 : 0);
                    }
                } else {
                    if (delta < 3) {
                        this._setDivider(this._dividerPending);
                    } else {
                        this._dividerChangeCounter = 1;
                    }
                }

                break;

            case 0x21:
            case 0x41:
                if (delta < (hblank ? 4 : 3)) {
                    this._setDivider(this._dividerPending);
                } else if (delta < (hblank ? 6 : 5)) {
                    this._setDivider(this._dividerPending);
                    this._renderCounter--;
                } else {
                    this._dividerChangeCounter = (hblank ? 0 : 1);
                }

                break;

            case 0x42:
            case 0x24:
                if (this._renderCounter < 1 || (hblank && (this._renderCounter % this._divider === 1))) {
                    this._setDivider(this._dividerPending);
                } else {
                    this._dividerChangeCounter = (this._divider - (this._renderCounter - 1) % this._divider);
                }

                break;

            default:
                throw new Error('cannot happen');
        }
    }

    resp(counter: number): void {
        this._counter = counter;

        if (this._rendering && (this._renderCounter - Count.renderCounterOffset) < 4) {
            this._renderCounter = Count.renderCounterOffset + (counter - 157);
        }
    }

    refp(value: number): void {
        const oldReflected = this._reflected;

        this._reflected = (value & 0x08) > 0;

        if (this._reflected !== oldReflected) {
            this._lineCacheViolated();
            this._updatePattern();
        }
    }

    vdelp(value: number): void {
        const oldDelaying = this._delaying;

        this._delaying = (value & 0x01) > 0;

        if (this._delaying !== oldDelaying) {
            this._lineCacheViolated();
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

    render(): void {
        this.collision = (
            this._rendering &&
            this._renderCounter >= this._renderCounterTripPoint &&
            (this._pattern & (1 << this._sampleCounter))
        ) ? 0 : this._collisionMask;
    }

    tick(): void {
        if (this._decodes[this._counter]) {
            this._rendering = true;
            this._renderCounter = Count.renderCounterOffset;
            this._sampleCounter = 0;
        } else if (this._rendering) {
            this._renderCounter++;

            switch (this._divider) {
                case 1:
                    if (this._renderCounter > 0) {
                        this._sampleCounter++;
                    }

                    if (
                        this._renderCounter >= 0 &&
                        this._dividerChangeCounter >= 0 &&
                        this._dividerChangeCounter-- === 0
                    ) {
                        this._setDivider(this._dividerPending);
                    }

                    break;

                default:
                    if (this._renderCounter > 1 && ((this._renderCounter - 1) % this._divider) === 0) {
                        this._sampleCounter++;
                    }

                    if (
                        this._renderCounter > 0 &&
                        this._dividerChangeCounter >= 0 &&
                        this._dividerChangeCounter-- === 0
                    ) {
                        this._setDivider(this._dividerPending);
                    }

                    break;
            }

            if (this._sampleCounter > 7) {
                this._rendering = false;
            }
        }

        if (++this._counter >= 160) {
            this._counter = 0;
        }
    }

    getPixel(colorIn: number): number {
        return this.collision ? colorIn : this.color;
    }

    shufflePatterns(): void {
        const oldPatternOld = this._patternOld;

        this._patternOld = this._patternNew;

        if (this._delaying && oldPatternOld !== this._patternOld) {
            this._lineCacheViolated();
            this._updatePattern();
        }
    }

    getRespClock(): number {
        switch (this._divider) {
            case 1:
                return (this._counter - 5 + 160)  % 160;

            case 2:
                return (this._counter - 9 + 160) % 160;

            case 4:
                return (this._counter - 12 + 160) % 160;

            default:
                throw new Error(`cannot happen: invalid divider ${this._divider}`);
        }
    }

    setColor(color: number): void {
        if (color !== this.color && this._pattern) {
            this._lineCacheViolated();
        }

        this.color = color;
    }

    private _updatePattern(): void {
        this._pattern = this._delaying ? this._patternOld : this._patternNew;

        if (!this._reflected) {
            this._pattern =
                ((this._pattern & 0x01) << 7)  |
                ((this._pattern & 0x02) << 5)  |
                ((this._pattern & 0x04) << 3)  |
                ((this._pattern & 0x08) << 1)  |
                ((this._pattern & 0x10) >>> 1) |
                ((this._pattern & 0x20) >>> 3) |
                ((this._pattern & 0x40) >>> 5) |
                ((this._pattern & 0x80) >>> 7);
        }
    }

    private _setDivider(divider: number): void {
        this._divider = divider;
        this._renderCounterTripPoint = divider === 1 ? 0 : 1;
    }

    color = 0xFFFFFFFF;
    collision = 0;

    private _hmmClocks = 0;
    private _counter = 0;
    private _moving = false;
    private _divider = 1;
    private _dividerPending = 1;
    private _dividerChangeCounter = -1;
    private _sampleCounter = 0;

    private _rendering = false;
    private _renderCounter = Count.renderCounterOffset;
    private _renderCounterTripPoint = 0;

    private _decodes: Uint8Array;

    private _patternNew = 0;
    private _patternOld = 0;
    private _pattern = 0;

    private _reflected = false;
    private _delaying = false;
}
