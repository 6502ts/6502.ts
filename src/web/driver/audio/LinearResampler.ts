/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import ResamplerInterface from './ResamplerInterface';

class LinearReasmpler implements ResamplerInterface {
    constructor() {
        this.reset(1, 1);
    }

    reset(sourceRate: number, targetRate: number) {
        this._ratio = sourceRate / targetRate;
        this._needsData = false;
        this._fractionalIndex = 0;

        for (let i = 0; i < 2; i++) {
            this._buffer[i] = 0;
        }
    }

    get(): number {
        const x = (1 - this._fractionalIndex) * this._buffer[0] + this._fractionalIndex * this._buffer[1];

        this._fractionalIndex += this._ratio;
        if (this._fractionalIndex > 1) {
            this._fractionalIndex -= 1;
            this._needsData = true;
        }

        return x;
    }

    push(sample: number): void {
        this._buffer[0] = this._buffer[1];
        this._buffer[1] = sample;

        this._needsData = false;
    }

    needsData(): boolean {
        return this._needsData;
    }

    private _buffer = new Float32Array(2);
    private _fractionalIndex = 0;
    private _needsData = false;

    private _ratio = 0;
}

export default LinearReasmpler;
