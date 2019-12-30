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

import Paddle from '../../io/Paddle';

const C = 68e-9, // capacitor
    RPOT = 1e6, // total paddle resistance
    R0 = 1.8e3, // series resistor
    U = 5, // supply voltage
    LINES_FULL = 380; // treshold voltage in terms of scanline count

export default class PaddleReader {
    constructor(clockFreq: number, private _paddle: Paddle) {
        this._uThresh = U * (1 - Math.exp(-LINES_FULL * 228 / clockFreq / (RPOT + R0) / C));

        this._paddle.valueChanged.addHandler((value: number) => {
            this._updateValue();
            this._value = value;
        });

        this.reset();
    }

    setCpuTimeProvider(provider: () => number): void {
        this._cpuTimeProvider = provider;
        this._timestamp = this._cpuTimeProvider();
    }

    reset(): void {
        this._u = 0;
        this._value = this._paddle.getValue();
        this._dumped = false;
        this._timestamp = this._cpuTimeProvider ? this._cpuTimeProvider() : 0;
    }

    vblank(value: number): void {
        const oldValue = this._dumped;

        if (value & 0x80) {
            this._dumped = true;
            this._u = 0;
        } else if (oldValue) {
            this._dumped = false;
            this._timestamp = this._cpuTimeProvider();
        }
    }

    inpt(): number {
        this._updateValue();

        const state = this._dumped ? false : this._u >= this._uThresh;

        return state ? 0x80 : 0;
    }

    private _updateValue(): void {
        if (this._dumped) {
            return;
        }

        const timestamp = this._cpuTimeProvider();

        // Update the voltage with the integral between the two timestamps
        this._u =
            U * (1 - (1 - this._u / U) * Math.exp(-(timestamp - this._timestamp) / (this._value * RPOT + R0) / C));

        this._timestamp = timestamp;
    }

    private _uThresh = 0;
    private _u = 0;
    private _dumped = false;
    private _value = 0.5;
    private _timestamp = 0;

    private _cpuTimeProvider: () => number = null;
}
