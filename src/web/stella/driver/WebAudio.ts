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

import VanillaDriver from '../../driver/WebAudio';
import WaveformAudioOutputInterface from '../../../machine/io/WaveformAudioOutputInterface';
import PCMAudioEndpointInterface from '../../driver/PCMAudioEndpointInterface';

class WebAudioDriver {
    constructor(private _fragmentSize?: number) {}

    init(): void {}

    bind(pcmAudio: boolean, channels: WebAudioDriver.Channels): void {
        if (this._channels) {
            return;
        }
        this._channels = [...channels] as any;

        if (!this._driver || this._pcmAudio !== pcmAudio) {
            if (this._driver) {
                this._driver.close();
            }

            this._driver = pcmAudio
                ? new VanillaDriver(0, this._channels.length, this._fragmentSize)
                : new VanillaDriver(this._channels.length, 0, this._fragmentSize);
            this._driver.init();
        }

        if (pcmAudio) {
            this._driver.bind([], this._channels as Array<PCMAudioEndpointInterface>);
        } else {
            this._driver.bind(this._channels as Array<WaveformAudioOutputInterface>, []);
        }

        for (let i = 0; i < this._channels.length; i++) {
            this._driver.setMasterVolume(i, this._volume);
        }

        this._pcmAudio = pcmAudio;
    }

    unbind(): void {
        if (!this._channels) {
            return;
        }

        this._driver.unbind();

        this._channels = null;
    }

    setMasterVolume(volume: number): void {
        this._volume = volume;

        if (this._channels) {
            for (let i = 0; i < this._channels.length; i++) {
                this._driver.setMasterVolume(i, this._volume);
            }
        }
    }

    getMasterVolume(): number {
        return this._volume;
    }

    async pause(): Promise<void> {
        if (this._driver) {
            await this._driver.pause();
        }
    }

    async resume(): Promise<void> {
        if (this._driver) {
            await this._driver.resume();
        }
    }

    private _driver: VanillaDriver;
    private _pcmAudio = false;
    private _volume = 1;
    private _channels: WebAudioDriver.Channels;
}

namespace WebAudioDriver {
    export type Channels = Array<WaveformAudioOutputInterface> | Array<PCMAudioEndpointInterface>;
}

export { WebAudioDriver as default };
