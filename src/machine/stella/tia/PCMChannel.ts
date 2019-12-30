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

class PCMChannel {
    constructor() {
        this.reset();
    }

    reset(): void {
        this._audc = this._audf = this._audv = 0;

        this._clkEnable = false;
        this._noiseFeedback = false;
        this._noiseCounterBit4 = false;
        this._pulseCounterHold = false;

        this._divCounter = 0;
        this._noiseCounter = 0;
        this._pulseCounter = 0;
    }

    phase0(): void {
        if (this._clkEnable) {
            this._noiseCounterBit4 = !!(this._noiseCounter & 0x01);

            switch (this._audc & 0x03) {
                case 0x00:
                case 0x01:
                    this._pulseCounterHold = false;
                    break;

                case 0x02:
                    this._pulseCounterHold = (this._noiseCounter & 0x1e) !== 0x02;
                    break;

                case 0x03:
                    this._pulseCounterHold = !this._noiseCounterBit4;
                    break;
            }

            switch (this._audc & 0x03) {
                case 0x00:
                    this._noiseFeedback =
                        !!((this._pulseCounter ^ this._noiseCounter) & 0x01) ||
                        !(this._noiseCounter !== 0 || this._pulseCounter !== 0x0a) ||
                        !(this._audc & 0x0c);

                    break;

                default:
                    this._noiseFeedback =
                        !!((this._noiseCounter & 0x04 ? 1 : 0) ^ (this._noiseCounter & 0x01)) ||
                        this._noiseCounter === 0;

                    break;
            }
        }

        this._clkEnable = this._divCounter === this._audf;

        if (this._divCounter === this._audf || this._divCounter === 0x1f) {
            this._divCounter = 0;
        } else {
            this._divCounter++;
        }
    }

    phase1(): number {
        let pulseFeedback = false;

        if (this._clkEnable) {
            switch (this._audc >>> 2) {
                case 0x00:
                    pulseFeedback =
                        !!((this._pulseCounter & 0x02 ? 1 : 0) ^ (this._pulseCounter & 0x01)) &&
                        this._pulseCounter !== 0x0a &&
                        !!(this._audc & 0x03);

                    break;

                case 0x01:
                    pulseFeedback = !(this._pulseCounter & 0x08);
                    break;

                case 0x02:
                    pulseFeedback = !this._noiseCounterBit4;
                    break;

                case 0x03:
                    pulseFeedback = !(!!(this._pulseCounter & 0x02) || !(this._pulseCounter & 0x0e));
                    break;
            }

            this._noiseCounter >>>= 1;
            if (this._noiseFeedback) {
                this._noiseCounter |= 0x10;
            }

            if (!this._pulseCounterHold) {
                this._pulseCounter = ~(this._pulseCounter >>> 1) & 0x07;

                if (pulseFeedback) {
                    this._pulseCounter |= 0x08;
                }
            }
        }

        return (this._pulseCounter & 0x01) * this._audv;
    }

    audc(value: number): void {
        this._audc = value & 0x0f;
    }

    audf(value: number): void {
        this._audf = value & 0x1f;
    }

    audv(value: number): void {
        this._audv = value & 0x0f;
    }

    private _audv = 0;
    private _audc = 0;
    private _audf = 0;

    private _clkEnable = false;
    private _noiseFeedback = false;
    private _noiseCounterBit4 = false;
    private _pulseCounterHold = false;

    private _divCounter = 0;
    private _noiseCounter = 0;
    private _pulseCounter = 0;
}

export { PCMChannel as default };
