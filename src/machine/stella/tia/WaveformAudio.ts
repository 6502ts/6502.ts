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

import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import WaveformAudioOutputInterface from '../../io/WaveformAudioOutputInterface';
import Config from '../Config';
import ToneGenerator from './ToneGenerator';
import AudioInterface from './AudioInterface';

export default class WaveformAudio implements WaveformAudioOutputInterface, AudioInterface {
    constructor(private _config: Config) {
        this._toneGenerator = new ToneGenerator(this._config);

        this.reset();
    }

    reset(): void {
        this._volume = -1;
        this._tone = -1;
        this._frequency = -1;
    }

    audc(value: number): void {
        value &= 0x0f;

        if (value === this._tone) {
            return;
        }

        this._tone = value;
        this._dispatchBufferChanged();
    }

    audf(value: number): void {
        value &= 0x1f;

        if (value === this._frequency) {
            return;
        }

        this._frequency = value;
        this._dispatchBufferChanged();
    }

    audv(value: number): void {
        value &= 0x0f;

        if (value === this._volume) {
            return;
        }

        this._volume = value / 15;
        this.volumeChanged.dispatch(this._volume);
    }

    setActive(active: boolean): void {
        this._active = active;

        if (active) {
            this._dispatchBufferChanged();
        } else {
            this.stop.dispatch(undefined);
        }
    }

    getVolume(): number {
        return this._volume >= 0 ? this._volume : 0;
    }

    getBuffer(key: number): AudioOutputBuffer {
        return this._toneGenerator.getBuffer(key);
    }

    protected _getKey(): number {
        return this._toneGenerator.getKey(this._tone, this._frequency);
    }

    protected _dispatchBufferChanged() {
        if (this._active && this.bufferChanged.hasHandlers) {
            this.bufferChanged.dispatch(this._getKey());
        }
    }

    bufferChanged = new Event<number>();
    volumeChanged = new Event<number>();
    stop = new Event<void>();

    private _volume = -1;
    private _tone = -1;
    private _frequency = -1;
    private _active = false;
    private _toneGenerator: ToneGenerator = null;
}
