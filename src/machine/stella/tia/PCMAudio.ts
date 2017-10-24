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

import { Event } from 'microevent.ts';

import PCMAudioInterface from '../../io/PCMAudioOutputInterface';
import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import AudioInterface from './AudioInterface';
import ToneGenerator from './ToneGenerator';
import StellaConfig from '../Config';

class PCMAudio implements PCMAudioInterface, AudioInterface {
    constructor(private _config: StellaConfig) {
        this._toneGenerator = new ToneGenerator(this._config);
        this._sampleRate = (this._config.tvMode === StellaConfig.TvMode.ntsc ? 60 * 262 : 50 * 312) * 2;
        this._frameSize = (this._config.tvMode === StellaConfig.TvMode.ntsc ? 262 : 312) * 2;

        this.reset();
    }

    reset() {
        this._bufferIndex = 0;
        this._tone = 0;
        this._frequency = 0;
        this._tone = 0;
        this._counter = 0;

        this._updatePattern();
    }

    tick(): void {
        if (this._isActive && this._currentOutputBuffer && (this._counter === 0 || this._counter === 113)) {
            this._currentOutputBuffer.getContent()[this._bufferIndex++] =
                this._currentPattern[this._patternIndex++] * this._volume;

            if (this._bufferIndex === this._currentOutputBuffer.getLength()) {
                this._dispatchBuffer();
            }

            if (this._patternIndex === this._currentPattern.length) {
                this._patternIndex = 0;
            }
        }

        if (++this._counter === 228) {
            this._counter = 0;
        }
    }

    isPaused(): boolean {
        return !this._isActive;
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

    setActive(isActive: boolean): void {
        this._isActive = isActive;
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

    private _updatePattern(): void {
        const key = this._toneGenerator.getKey(this._tone, this._frequency);

        if (!this._patterns.has(key)) {
            this._patterns.set(key, this._toneGenerator.getBuffer(key).getContent());
        }

        this._currentPattern = this._patterns.get(key);
        this._patternIndex = 0;
    }

    newFrame = new Event<AudioOutputBuffer>();

    private _patterns = new Map<number, Float32Array>();
    private _currentPattern: Float32Array = null;
    private _currentOutputBuffer: AudioOutputBuffer = null;

    private _frequency = 0;
    private _volume = 0;
    private _tone = 0;
    private _patternIndex = 0;
    private _bufferIndex = 0;
    private _sampleRate = 0;
    private _frameSize: number;
    private _counter = 0;
    private _isActive = false;

    private _bufferFactory: PCMAudioInterface.FrameBufferFactory;
    private _toneGenerator: ToneGenerator;
}

export default PCMAudio;
