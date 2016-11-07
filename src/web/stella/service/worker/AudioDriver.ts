/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

import {RpcProviderInterface} from 'worker-rpc';
import AudioOutputInterface from '../../../../machine/io/AudioOutputInterface';

import {
    SIGNAL_TYPE,
    AudioBufferChangeMessage,
    AudioVolumeChangeMessage
} from './messages';

class AudioDriver {

    constructor (
        private _index: number,
        private _rpc: RpcProviderInterface
    ) {
        this._handlerContext = {
            index: this._index,
            self: this
        };
    }

    bind(audio: AudioOutputInterface): void {
        if (this._audio) {
            return;
        }

        this._audio = audio;

        this._audio.bufferChanged.addHandler(AudioDriver._onBufferChanged, this._handlerContext);
        this._audio.volumeChanged.addHandler(AudioDriver._onVolumeChanged, this._handlerContext);
        this._audio.stop.addHandler(AudioDriver._onStop, this._handlerContext);
    }

    unbind(): void {
        if (!this._audio) {
            return;
        }

        this._audio.bufferChanged.removeHandler(AudioDriver._onBufferChanged, this._handlerContext);
        this._audio.volumeChanged.removeHandler(AudioDriver._onVolumeChanged, this._handlerContext);
        this._audio.stop.removeHandler(AudioDriver._onStop, this._handlerContext);

        this._audio = null;
    }

    private static _onBufferChanged(key: number, context: HandlerContext) {
        context.self._rpc.signal<AudioBufferChangeMessage>(SIGNAL_TYPE.audioBufferChange, {
            index: context.index,
            key
        });
    }

    private static _onVolumeChanged(value: number, context: HandlerContext) {
        context.self._rpc.signal<AudioVolumeChangeMessage>(SIGNAL_TYPE.audioVolumeChange, {
            index: context.index,
            value
        });
    }

    private static _onStop(value: void, context: HandlerContext) {
        context.self._rpc.signal<number>(SIGNAL_TYPE.audioStop, context.self._index);
    }

    private _audio: AudioOutputInterface = null;
    private _handlerContext: HandlerContext = null;

}

interface HandlerContext {
    self: AudioDriver;
    index: number;
}

export default AudioDriver;