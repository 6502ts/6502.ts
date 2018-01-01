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
