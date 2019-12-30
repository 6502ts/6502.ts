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

export { LinearReasmpler as default };
