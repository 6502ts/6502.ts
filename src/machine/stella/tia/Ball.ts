/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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

const enum Count {
    renderCounterOffset = -4
}

export default class Ball {

    constructor(
        private _collisionMask: number,
        private _flushLineCache: () => void
    ) {
        this.reset();
    }

    reset(): void {
        this.color = 0xFFFFFFFF;
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
        this.collision = (this._rendering && this._renderCounter >= 0 && this._enabled) ? 0 : this._collisionMask;

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

    color = 0xFFFFFFFF;
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
