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

import { RpcProviderInterface } from 'worker-rpc';
import WaveformAudioOutputInterface from '../../../../machine/io/WaveformAudioOutputInterface';
import ToneGenerator from '../../../../machine/stella/tia/ToneGenerator';
import StellaConfig from '../../../../machine/stella/Config';
import AudioOutputBuffer from '../../../../tools/AudioOutputBuffer';

import {
    SIGNAL_TYPE,
    RPC_TYPE,
    WaveformAudioBufferChangeMessage,
    WaveformAudioVolumeChangeMessage,
    WaveformAudioParametersResponse
} from './messages';

class WaveformAudioProxy implements WaveformAudioOutputInterface {
    constructor(private _index: number, private _rpc: RpcProviderInterface) {}

    init(): this {
        this._rpc
            .registerSignalHandler(SIGNAL_TYPE.waveformAudioBufferChange, this._onBufferChangeSignal.bind(this))
            .registerSignalHandler(SIGNAL_TYPE.waveformAudioVolumeChange, this._onVolumeChangeSignal.bind(this))
            .registerSignalHandler(SIGNAL_TYPE.audioStop, this._onStopSignal.bind(this));

        return this;
    }

    async start(config: StellaConfig): Promise<void> {
        const parameters = await this._rpc.rpc<void, WaveformAudioParametersResponse>(
            RPC_TYPE.getWaveformAudioParameters(this._index)
        );

        this._toneGenerator.setConfig(config);
        this.setVolume(parameters.volume);
    }

    setVolume(value: number): this {
        this._volume = value;

        return this;
    }

    getVolume(): number {
        return this._volume;
    }

    getBuffer(key: number): AudioOutputBuffer {
        return this._toneGenerator.getBuffer(key);
    }

    private _onVolumeChangeSignal(message: WaveformAudioVolumeChangeMessage): void {
        if (message.index === this._index) {
            this._volume = message.value;
            this.volumeChanged.dispatch(this._volume);
        }
    }

    private _onBufferChangeSignal(message: WaveformAudioBufferChangeMessage): void {
        if (message.index === this._index) {
            this.bufferChanged.dispatch(message.key);
        }
    }

    private _onStopSignal(index: number): void {
        if (index === this._index) {
            this.stop.dispatch(undefined);
        }
    }

    bufferChanged = new Event<number>();
    volumeChanged = new Event<number>();
    stop = new Event<void>();

    private _toneGenerator = new ToneGenerator();
    private _volume = 0;
}

export { WaveformAudioProxy as default };
