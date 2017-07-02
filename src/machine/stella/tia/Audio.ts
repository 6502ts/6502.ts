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

import {Event} from 'microevent.ts';

import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import AudioOutputInterface from '../../io/AudioOutputInterface';
import Config from '../Config';
import ToneGenerator from './ToneGenerator';

export default class Audio implements AudioOutputInterface {

    constructor(private _config: Config ) {
        this._toneGenerator = new ToneGenerator(this._config);

        this.reset();
    }

    reset(): void {
        this._volume = -1;
        this._tone = -1;
        this._frequency = -1;
    }

    audc(value: number): void {
        value &= 0x0F;

        if (value === this._tone) {
            return;
        }

        this._tone = value;
        this._dispatchBufferChanged();
    }

    audf(value: number): void {
        value &= 0x1F;

        if (value === this._frequency) {
            return;
        }

        this._frequency = value;
        this._dispatchBufferChanged();
    }

    audv(value: number): void {
        value &= 0x0F;

        if (value === this._volume) {
            return;
        }

        this._volume = value / 15;
        this.volumeChanged.dispatch(this._volume);
    }

    setActive(active: boolean): void {
        this._active = active;

        if (active) {
            this._dispatchBufferChanged();
        } else {
            this.stop.dispatch(undefined);
        }
    }

    getVolume(): number {
        return this._volume >= 0 ? this._volume : 0;
    }

    getBuffer(key: number): AudioOutputBuffer {

        return this._toneGenerator.getBuffer(key);
    }

    protected _getKey(): number {
        return this._toneGenerator.getKey(this._tone, this._frequency);
    }

    protected _dispatchBufferChanged() {
        if (this._active && this.bufferChanged.hasHandlers) {
            this.bufferChanged.dispatch(this._getKey());
        }
    }

    bufferChanged = new Event<number>();
    volumeChanged = new Event<number>();
    stop = new Event<void>();

    private _volume = -1;
    private _tone = -1;
    private _frequency = -1;
    private _active = false;
    private _toneGenerator: ToneGenerator = null;

}
