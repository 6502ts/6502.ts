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
