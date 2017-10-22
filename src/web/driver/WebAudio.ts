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

import ChannelInterface from './audio/ChannelInterface';
import WaveformChannel from './audio/WaveformChannel';
import PCMChannel from './audio/PCMChannel';

import WaveformAudioOutputInterface from '../../machine/io/WaveformAudioOutputInterface';
import PCMAudioOutputInterface from '../../machine/io/PCMAudioOutputInterface';

type AudioContextType = typeof AudioContext;
type AudioOutputInterface = WaveformAudioOutputInterface | PCMAudioOutputInterface;

declare namespace window {
    const webkitAudioContext: AudioContextType;
    // tslint:disable-next-line:variable-name
    const AudioContext: AudioContextType;
}

class WebAudioDriver {
    constructor(channels: number, private _channelTypes: Array<WebAudioDriver.ChannelType>) {
        this._channels = new Array<ChannelInterface>(channels);

        for (let i = 0; i < channels; i++) {
            this._channels[i] =
                this._channelTypes[i] === WebAudioDriver.ChannelType.pcm
                    ? new PCMChannel()
                    : new WaveformChannel(this._cache);
        }
    }

    init(): void {
        const ctor = window.AudioContext || window.webkitAudioContext;

        if (!ctor) {
            throw new Error(`web audio is not supported by runtime`);
        }

        this._context = new ctor();

        try {
            this._context.destination.channelCount = 1;
        } catch (e) {
            console.warn('audio driver: failed to set channel count');
        }

        this._merger = this._context.createChannelMerger(this._channels.length);
        this._merger.connect(this._context.destination);

        this._channels.forEach(channel => channel.init(this._context, this._merger));
    }

    bind(sources: Array<AudioOutputInterface>): void {
        if (this._sources) {
            return;
        }

        if (sources.length !== this._channels.length) {
            throw new Error(`invalid number of sources: got ${sources.length}, expected ${this._channels.length}`);
        }

        this._sources = sources;

        for (let i = 0; i < this._sources.length; i++) {
            this._channels[i].bind(this._sources[i]);
        }
    }

    unbind(): void {
        if (!this._sources) {
            return;
        }

        this._channels.forEach(channel => channel.unbind());

        this._sources = null;
    }

    setMasterVolume(channel: number, volume: number): void {
        this._channels[channel].setMasterVolume(volume);
    }

    private _context: AudioContext = null;
    private _merger: ChannelMergerNode = null;
    private _channels: Array<ChannelInterface> = null;
    private _sources: Array<AudioOutputInterface> = null;
    private _cache = new Map<number, AudioBuffer>();
}

namespace WebAudioDriver {
    export const enum ChannelType {
        waveform,
        pcm
    }
}

export default WebAudioDriver;
