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

import KeypadController from '../io/KeypadController';

const PROBE_DELAY = 0.0004; // 400 microseconds

export default class KeypadsReader {

    constructor(private _keypads: Array<KeypadController>) {
        this.reset();
    }

    setCpuTimeProvider(provider: () => number): void {
        this._cpuTimeProvider = provider;
        this._returnTimestamp = 0;
    }

    reset(): void {
        this._swacnt = 0;
        this._swcha_out = 0;
        this._returnTimestamp = 0;
    }

    vblank(value: number): void {
        // BUGBUG: react to vblank?
    }

    swcha(value: number): void {
        this._swcha_out = (~value) & this._swacnt;
        const currentTimestamp = this._cpuTimeProvider();
        this._returnTimestamp = currentTimestamp + PROBE_DELAY;
    }

    swacnt(value: number): void {
        this._swacnt = value;
    }

    inpt(pad: number, column: number): number {
        const currentTimestamp = this._cpuTimeProvider();
        let s = (currentTimestamp >= this._returnTimestamp) ? this._swcha_out : 0;
        if (0 === pad) {
            s = s >> 4;
        }
        let state = false;
        for (let row = 0; row < 4; row++) {
            if (1 === (s & 0x01)) {
                state = state || this._keypads[pad].getKey(row, column).read();
            }
            s = s >> 1;
        }
        return state ? 0 : 0x80;

    }

    private _swacnt = 0;
    private _swcha_out = 0;
    private _returnTimestamp = 0;

    private _cpuTimeProvider: () => number = null;

}
