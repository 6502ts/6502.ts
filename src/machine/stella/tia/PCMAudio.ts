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

import { Event } from 'microevent.ts';

import PCMAudioInterface from '../../io/PCMAudioOutputInterface';
import AudioInterface from './AudioInterface';
import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import StellaConfig from '../Config';
import PCMChannel from './PCMChannel';

// The highest resistance in the resistor network is 30kOhms, the others follow from division
// by powers of two: 30 -> 15 -> 7.5 -> 3.75
const R_MAX = 30;

// The second resistor in the divider (1kOhms)
const R = 1;

// The maximum sum of the individual volume of the two channels: 0x1e = 0xf + 0xf
const VOL_MAX = 0x1e;

const mixingTable = new Float32Array(VOL_MAX + 1);

export namespace __init {
    for (let vol = 0; vol <= VOL_MAX; vol++) {
        mixingTable[vol] = vol / VOL_MAX * (R_MAX + R * VOL_MAX) / (R_MAX + R * vol);
    }
}

class PCMAudio implements PCMAudioInterface {
    constructor(private _config: StellaConfig) {
        this._sampleRate = (this._config.tvMode === StellaConfig.TvMode.ntsc ? 60 * 262 : 50 * 312) * 2;
        this._frameSize = (this._config.tvMode === StellaConfig.TvMode.ntsc ? 262 : 312) * 4;

        this.reset();
    }

    getChannels(): Array<AudioInterface> {
        return [
            {
                audv: value => this._channel0.audv(value),
                audc: value => this._channel0.audc(value),
                audf: value => this._channel0.audf(value),
                reset: () => this.reset(),
                setActive: active => this.setActive(active)
            },
            {
                audv: value => this._channel1.audv(value),
                audc: value => this._channel1.audc(value),
                audf: value => this._channel1.audf(value),
                reset: () => undefined,
                setActive: () => undefined
            }
        ];
    }

    reset() {
        this._bufferIndex = 0;
        this._counter = 0;

        this._channel0.reset();
        this._channel1.reset();
    }

    tick(): void {
        switch (this._counter) {
            case 9:
            case 81:
                this._channel0.phase0();
                this._channel1.phase0();
                break;

            case 37:
            case 149:
                this._currentOutputBuffer.getContent()[this._bufferIndex++] =
                    mixingTable[this._channel0.phase1() + this._channel1.phase1()];

                if (this._bufferIndex === this._currentOutputBuffer.getLength()) {
                    this._dispatchBuffer();
                }

                break;
        }

        if (++this._counter === 228) {
            this._counter = 0;
        }
    }

    isPaused(): boolean {
        return !this._isActive;
    }

    setActive(isActive: boolean): void {
        if (isActive === this._isActive) {
            return;
        }

        this._isActive = isActive;

        this.togglePause.dispatch(!isActive);
    }

    getSampleRate(): number {
        return this._sampleRate;
    }

    getFrameSize(): number {
        return this._frameSize;
    }

    setFrameBufferFactory(factory: PCMAudioInterface.FrameBufferFactory): void {
        this._bufferFactory = factory;

        if (!this._currentOutputBuffer && factory) {
            this._currentOutputBuffer = factory();
            this._bufferIndex = 0;
        }
    }

    private _dispatchBuffer(): void {
        this.newFrame.dispatch(this._currentOutputBuffer);
        this._currentOutputBuffer = this._bufferFactory ? this._bufferFactory() : null;
        this._bufferIndex = 0;
    }

    newFrame = new Event<AudioOutputBuffer>();

    togglePause = new Event<boolean>();

    private _currentOutputBuffer: AudioOutputBuffer = null;

    private _bufferIndex = 0;
    private _sampleRate = 0;
    private _frameSize: number;
    private _counter = 0;
    private _isActive = false;

    private _bufferFactory: PCMAudioInterface.FrameBufferFactory;

    private _channel0 = new PCMChannel();
    private _channel1 = new PCMChannel();
}

export { PCMAudio as default };
