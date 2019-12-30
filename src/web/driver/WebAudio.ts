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

import { Mutex } from 'async-mutex';

import ChannelInterface from './audio/ChannelInterface';
import WaveformChannel from './audio/WaveformChannel';
import PCMChannel from './audio/PCMChannel';

import WaveformAudioOutputInterface from '../../machine/io/WaveformAudioOutputInterface';
import PCMAudioEndpointInterface from './PCMAudioEndpointInterface';
import { isIOS, isSafari } from '../../tools/browser';

const audioNeedsInteraction = isIOS || isSafari;
const INTERACTION_EVENTS = ['touchstart', 'click', 'keydown'];

type AudioContextType = typeof AudioContext;

declare namespace window {
    const webkitAudioContext: AudioContextType;
    // tslint:disable-next-line:variable-name
    const AudioContext: AudioContextType;
}

const audioContextCtor = window.AudioContext || window.webkitAudioContext;

class PreallocatedContext {
    constructor() {
        if (!audioContextCtor) {
            return;
        }

        this.context = new audioContextCtor();

        try {
            this.context.destination.channelCount = 1;
        } catch (e) {
            console.warn('audio driver: failed to set channel count');
        }

        INTERACTION_EVENTS.forEach(event => document.addEventListener(event, this._interactionListener));
    }

    stopListening(): void {
        INTERACTION_EVENTS.forEach(event => document.removeEventListener(event, this._interactionListener));
    }

    private _interactionListener = () => {
        const context = this.context;

        this.interactionRequired = false;
        INTERACTION_EVENTS.forEach(event => document.removeEventListener(event, this._interactionListener));

        this.mutex.runExclusive(() => {
            context.resume();

            return new Promise(r =>
                setTimeout(() => {
                    context.suspend();
                    r();
                }, 100)
            );
        });
    };

    public readonly mutex = new Mutex();
    public readonly context: AudioContext = null;
    public interactionRequired = true;
}

let preallocatedContext = audioNeedsInteraction ? new PreallocatedContext() : null;

class WebAudioDriver {
    constructor(waveformChannels = 0, pcmChannels = 0, fragmentSize?: number) {
        this._waveformChannels = new Array<WaveformChannel>(waveformChannels);
        this._pcmChannels = new Array<PCMChannel>(pcmChannels);

        for (let i = 0; i < waveformChannels; i++) {
            this._waveformChannels[i] = new WaveformChannel(this._cache);
        }

        for (let i = 0; i < pcmChannels; i++) {
            this._pcmChannels[i] = new PCMChannel(fragmentSize);
        }

        this._channels = [...this._waveformChannels, ...this._pcmChannels];
    }

    init(): void {
        if (preallocatedContext) {
            const p = preallocatedContext;
            preallocatedContext = new PreallocatedContext();

            this._context = p.context;
            p.stopListening();

            this._mutex = p.mutex;

            if (p.interactionRequired) {
                INTERACTION_EVENTS.forEach(event => document.addEventListener(event, this._touchListener, true));
            }
        } else {
            if (!audioContextCtor) {
                throw new Error(`web audio is not supported by runtime`);
            }

            this._context = new audioContextCtor();

            try {
                this._context.destination.channelCount = 1;
            } catch (e) {
                console.warn('audio driver: failed to set channel count');
            }
        }

        this._merger = this._context.createChannelMerger(this._channels.length);
        this._merger.connect(this._context.destination);

        this._channels.forEach(channel => channel.init(this._context, this._merger));
    }

    bind(
        waveformSources: Array<WaveformAudioOutputInterface> = [],
        pcmSources: Array<PCMAudioEndpointInterface> = []
    ): void {
        if (this._isBound) {
            return;
        }

        if (waveformSources.length !== this._waveformChannels.length) {
            throw new Error(
                `invalid number of waveform sources: expected ${this._waveformChannels.length}, got ${waveformSources.length}`
            );
        }

        if (pcmSources.length !== this._pcmChannels.length) {
            throw new Error(
                `invalid number of waveform sources: expected ${this._pcmChannels.length}, got ${pcmSources.length}`
            );
        }

        this._waveformChannels.forEach((channel, i) => channel.bind(waveformSources[i]));
        this._pcmChannels.forEach((channel, i) => channel.bind(pcmSources[i]));

        this._isBound = true;

        this.resume();
    }

    unbind(): void {
        if (!this._isBound) {
            return;
        }

        this._channels.forEach(channel => channel.unbind());

        this._isBound = false;

        this.pause();
    }

    setMasterVolume(channel: number, volume: number): void {
        this._channels[channel].setMasterVolume(volume);
    }

    pause(): Promise<void> {
        return this._mutex.runExclusive((): any => {
            if (this._suspended) {
                return;
            }

            this._suspended = true;

            return new Promise(resolve => {
                this._context.suspend().then(resolve, resolve);
                setTimeout(resolve, 200);
            });
        });
    }

    resume(): Promise<void> {
        return this._mutex.runExclusive((): any => {
            if (!this._suspended) {
                return;
            }

            this._suspended = false;

            return new Promise(resolve => {
                this._context.resume().then(resolve, resolve);
                setTimeout(resolve, 200);
            });
        });
    }

    close(): void {
        this._mutex.runExclusive(() => this._context.close());
    }

    private _touchListener = () => {
        INTERACTION_EVENTS.forEach(event => document.removeEventListener(event, this._touchListener, true));

        if (!this._context) {
            return;
        }

        this._context.resume();

        setTimeout(() => {
            this._mutex.runExclusive(() => (this._suspended ? this._context.suspend() : this._context.resume()));
        }, 10);
    };

    private _context: AudioContext = null;
    private _merger: ChannelMergerNode = null;
    private _waveformChannels: Array<WaveformChannel> = null;
    private _pcmChannels: Array<PCMChannel> = null;
    private _channels: Array<ChannelInterface> = null;
    private _cache = new Map<number, AudioBuffer>();
    private _mutex = new Mutex();

    private _suspended = true;

    private _isBound = false;
}

export { WebAudioDriver as default };
