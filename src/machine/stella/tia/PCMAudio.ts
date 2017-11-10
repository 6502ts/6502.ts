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
import AudioInterface from './AudioInterface';
import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import StellaConfig from '../Config';
import PCMChannel from './PCMChannel';

const mixingTable = new Float32Array(0x1f);

export namespace __init {
    for (let i = 0; i < 0x1f; i++) {
        mixingTable[i] = i / 0x1e * (30 + 0x1e) / (30 + i);
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

export default PCMAudio;
