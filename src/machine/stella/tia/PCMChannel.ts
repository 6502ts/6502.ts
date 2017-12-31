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

export default PCMChannel;
