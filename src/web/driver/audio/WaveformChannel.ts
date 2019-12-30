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

export { WaveformChannel as default };
