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

import ChannelInterface from './ChannelInterface';
import WaveformAudioOutputInterface from '../../../machine/io/WaveformAudioOutputInterface';

class WaveformChannel implements ChannelInterface {
    constructor(private _cache: Map<number, AudioBuffer>) {}

    init(context: AudioContext, target: AudioNode): void {
        this._context = context;

        this._gain = this._context.createGain();
        this._gain.connect(target);
    }

    bind(target: WaveformAudioOutputInterface): void {
        if (this._audio) {
            return;
        }

        this._audio = target;
        this._volume = this._audio.getVolume();
        this._updateGain();

        this._audio.volumeChanged.addHandler(WaveformChannel._onVolumeChanged, this);
        this._audio.bufferChanged.addHandler(WaveformChannel._onBufferChanged, this);
        this._audio.stop.addHandler(WaveformChannel._onStop, this);
    }

    unbind(): void {
        if (!this._audio) {
            return;
        }

        this._audio.volumeChanged.removeHandler(WaveformChannel._onVolumeChanged, this);
        this._audio.bufferChanged.removeHandler(WaveformChannel._onBufferChanged, this);
        this._audio.stop.removeHandler(WaveformChannel._onStop, this);

        if (this._source) {
            this._source.stop();
            this._source = null;
        }

        this._audio = null;
    }

    setMasterVolume(volume: number): void {
        this._masterVolume = volume;
        this._updateGain();
    }

    private static _onVolumeChanged(volume: number, self: WaveformChannel): void {
        self._volume = volume;
        self._updateGain();
    }

    private static _onBufferChanged(key: number, self: WaveformChannel): void {
        if (!self._cache.has(key)) {
            const sampleBuffer = self._audio.getBuffer(key),
                audioBuffer = self._context.createBuffer(1, sampleBuffer.getLength(), sampleBuffer.getSampleRate());

            audioBuffer.getChannelData(0).set(sampleBuffer.getContent());
            self._cache.set(key, audioBuffer);
        }

        const buffer = self._cache.get(key),
            source = self._context.createBufferSource();

        if (self._source) {
            self._source.stop();
        }

        source.loop = true;
        source.buffer = buffer;
        source.connect(self._gain);
        source.start();

        self._source = source;
    }

    private static _onStop(payload: void, self: WaveformChannel): void {
        if (self._source) {
            self._source.stop();
            self._source = null;
        }
    }

    private _updateGain(): void {
        this._gain.gain.value = this._volume * this._masterVolume;
    }

    private _context: AudioContext = null;
    private _source: AudioBufferSourceNode = null;
    private _gain: GainNode = null;
    private _audio: WaveformAudioOutputInterface = null;

    private _volume = 0;
    private _masterVolume = 1;
}

export default WaveformChannel;
