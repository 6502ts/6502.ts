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

import ToneGenerator from './ToneGenerator';

class PCMChannel {
    constructor(private _patternCache: Map<number, Float32Array>, private _toneGenerator: ToneGenerator) {
        this.reset();
    }

    reset() {
        this._bufferIndex = 0;
        this._tone = 0;
        this._frequency = 0;
        this._tone = 0;

        this._updatePattern();
    }

    nextSample(): number {
        const sample = this._currentPattern[this._patternIndex++] * this._volume;

        if (this._patternIndex === this._currentPattern.length) {
            this._patternIndex = 0;
        }

        return sample;
    }

    audc(value: number): void {
        value &= 0x0f;

        if (value === this._tone) {
            return;
        }

        this._tone = value;
        this._updatePattern();
    }

    audf(value: number): void {
        value &= 0x1f;

        if (value === this._frequency) {
            return;
        }

        this._frequency = value;
        this._updatePattern();
    }

    audv(value: number): void {
        this._volume = (value & 0x0f) / 15;
    }

    private _updatePattern(): void {
        const key = this._toneGenerator.getKey(this._tone, this._frequency);

        if (!this._patternCache.has(key)) {
            this._patternCache.set(key, this._toneGenerator.getBuffer(key).getContent());
        }

        this._currentPattern = this._patternCache.get(key);
        this._patternIndex = 0;
    }

    private _currentPattern: Float32Array = null;

    private _frequency = 0;
    private _volume = 0;
    private _tone = 0;
    private _patternIndex = 0;
    private _bufferIndex = 0;
}

export default PCMChannel;
