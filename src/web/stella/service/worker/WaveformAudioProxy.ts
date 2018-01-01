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
