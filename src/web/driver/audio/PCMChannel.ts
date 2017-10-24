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

import ChannelInterface from './ChannelInterface';
import PCMAudioOutputInterface from '../../../machine/io/PCMAudioOutputInterface';
import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import RingBuffer from '../../../tools/RingBuffer';

class PCMChannel implements ChannelInterface {
    init(context: AudioContext, target: AudioNode) {
        this._outputSampleRate = context.sampleRate;

        this._gain = context.createGain();
        this._gain.gain.value = this._volume;
        this._gain.connect(target);

        this._processor = context.createScriptProcessor(1024, 1, 1);
        this._bufferSize = this._processor.bufferSize;

        this._processor.connect(this._gain);
        this._processor.onaudioprocess = e => this._processAudio(e);

        const buffer = context.createBuffer(1, 1, context.sampleRate);
        buffer.getChannelData(0).set([0]);
    }

    bind(audio: PCMAudioOutputInterface): void {
        this.unbind();

        this._audio = audio;
        this._fragmentSize = audio.getFrameSize();
        this._inputSampleRate = audio.getSampleRate();
        this._fragmentIndex = 0;
        this._lastFragment = null;
        this._fragmentRing = new RingBuffer<AudioOutputBuffer>(
            Math.ceil(2 * this._bufferSize / this._outputSampleRate / this._fragmentSize * this._inputSampleRate)
        );

        this._audio.newFrame.addHandler(PCMChannel._onNewFragment, this);
    }

    unbind() {
        if (!this._audio) {
            return;
        }

        this._audio.newFrame.removeHandler(PCMChannel._onNewFragment, this);

        if (this._lastFragment) {
            this.releaseFragment.dispatch(this._lastFragment);
            this._lastFragment = null;
        }

        if (this._currentFragment) {
            this.releaseFragment.dispatch(this._currentFragment);
            this._currentFragment = null;
        }

        this._fragmentRing.forEach(b => this.releaseFragment.dispatch(b));
        this._fragmentRing.clear();
        this._fragmentRing = null;
    }

    setMasterVolume(volume: number): void {
        this._volume = volume;
    }

    private static _onNewFragment(fragment: AudioOutputBuffer, self: PCMChannel): void {
        self._fragmentRing.push(fragment);

        if (!self._currentFragment) {
            self._currentFragment = self._fragmentRing.pop();
            self._fragmentIndex = 0;
        }
    }

    private _processAudio(e: AudioProcessingEvent): void {
        if (!this._audio) {
            return;
        }

        const outputBuffer = e.outputBuffer.getChannelData(0),
            previousFragmentBuffer = this._lastFragment && this._lastFragment.getContent();

        let fragmentBuffer = this._currentFragment && this._currentFragment.getContent(),
            bufferIndex = 0;

        while (bufferIndex < this._bufferSize && this._currentFragment) {
            outputBuffer[bufferIndex++] = fragmentBuffer[Math.floor(this._fragmentIndex)] * this._volume;
            this._fragmentIndex += this._inputSampleRate / this._outputSampleRate;

            if (this._fragmentIndex >= this._fragmentSize) {
                this._fragmentIndex -= this._fragmentSize;

                if (this._lastFragment) {
                    this.releaseFragment.dispatch(this._lastFragment);
                }

                this._lastFragment = this._currentFragment;
                this._currentFragment = this._fragmentRing.pop();

                fragmentBuffer = this._currentFragment && this._currentFragment.getContent();
            }
        }

        if (bufferIndex < this._bufferSize && this._audio.isPaused()) {
            console.log(`audio underrun: ${this._bufferSize - bufferIndex}`);
        }

        while (bufferIndex < this._bufferSize) {
            outputBuffer[bufferIndex++] =
                (this._audio && this._audio.isPaused()) || !previousFragmentBuffer
                    ? 0
                    : previousFragmentBuffer[Math.floor(this._fragmentIndex)] * this._volume;

            this._fragmentIndex += this._inputSampleRate / this._outputSampleRate;
            if (this._fragmentIndex >= this._fragmentSize) {
                this._fragmentIndex -= this._fragmentSize;
            }
        }
    }

    releaseFragment = new Event<AudioOutputBuffer>();

    private _outputSampleRate = 0;
    private _bufferSize = 0;
    private _volume = 1;

    private _gain: GainNode = null;
    private _processor: ScriptProcessorNode = null;

    private _fragmentRing: RingBuffer<AudioOutputBuffer> = null;

    private _fragmentSize = 0;
    private _inputSampleRate = 0;
    private _fragmentIndex = 0;
    private _currentFragment: AudioOutputBuffer = null;
    private _lastFragment: AudioOutputBuffer = null;

    private _audio: PCMAudioOutputInterface;
}

export default PCMChannel;
