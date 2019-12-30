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

import { RpcProviderInterface } from 'worker-rpc';
import WaveformAudioOutputInterface from '../../../../machine/io/WaveformAudioOutputInterface';

import {
    SIGNAL_TYPE,
    RPC_TYPE,
    WaveformAudioBufferChangeMessage,
    WaveformAudioVolumeChangeMessage,
    WaveformAudioParametersResponse
} from './messages';

class WaveformAudioDriver {
    constructor(private _index: number, private _rpc: RpcProviderInterface) {
        this._rpc.registerRpcHandler(
            RPC_TYPE.getWaveformAudioParameters(this._index),
            this._onGetWaveformAudioParameters.bind(this)
        );
    }

    bind(audio: WaveformAudioOutputInterface): void {
        if (this._audio) {
            return;
        }

        this._audio = audio;

        this._audio.bufferChanged.addHandler(WaveformAudioDriver._onBufferChanged, this);
        this._audio.volumeChanged.addHandler(WaveformAudioDriver._onVolumeChanged, this);
        this._audio.stop.addHandler(WaveformAudioDriver._onStop, this);
    }

    unbind(): void {
        if (!this._audio) {
            return;
        }

        this._audio.bufferChanged.removeHandler(WaveformAudioDriver._onBufferChanged, this);
        this._audio.volumeChanged.removeHandler(WaveformAudioDriver._onVolumeChanged, this);
        this._audio.stop.removeHandler(WaveformAudioDriver._onStop, this);

        this._audio = null;
    }

    private static _onBufferChanged(key: number, self: WaveformAudioDriver) {
        self._rpc.signal<WaveformAudioBufferChangeMessage>(SIGNAL_TYPE.waveformAudioBufferChange, {
            index: self._index,
            key
        });
    }

    private static _onVolumeChanged(value: number, self: WaveformAudioDriver) {
        self._rpc.signal<WaveformAudioVolumeChangeMessage>(SIGNAL_TYPE.waveformAudioVolumeChange, {
            index: self._index,
            value
        });
    }

    private static _onStop(value: void, self: WaveformAudioDriver) {
        self._rpc.signal<number>(SIGNAL_TYPE.audioStop, self._index);
    }

    private _onGetWaveformAudioParameters(): WaveformAudioParametersResponse {
        return { volume: this._audio.getVolume() };
    }

    private _audio: WaveformAudioOutputInterface = null;
}

export { WaveformAudioDriver as default };
