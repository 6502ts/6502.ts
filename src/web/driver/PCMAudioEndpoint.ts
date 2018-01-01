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

import Pool from '../../tools/pool/Pool';
import InducedPool from '../../tools/pool/InducedPool';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import PCMAudioEndpointInterface from './PCMAudioEndpointInterface';
import PCMAudioOutputInterface from '../../machine/io/PCMAudioOutputInterface';
import AudioOutputBuffer from '../../tools/AudioOutputBuffer';

class PCMAudioEndpoint implements PCMAudioEndpointInterface {
    constructor(private _output: PCMAudioOutputInterface) {
        this._output.newFrame.addHandler((buffer: AudioOutputBuffer) =>
            this.newFrame.dispatch(this._pcmDataPool.get(this._audioBufferMap.get(buffer)))
        );

        this._output.togglePause.addHandler((paused: boolean) => this.togglePause.dispatch(paused));

        this._output.setFrameBufferFactory(() => {
            const wrappedBuffer = this._audioBufferPool.get();

            if (!this._audioBufferMap.has(wrappedBuffer.get())) {
                this._audioBufferMap.set(wrappedBuffer.get(), wrappedBuffer);
            }

            return wrappedBuffer.get();
        });
    }

    getSampleRate(): number {
        return this._output.getSampleRate();
    }

    getFrameSize(): number {
        return this._output.getFrameSize();
    }

    isPaused(): boolean {
        return this._output.isPaused();
    }

    newFrame = new Event<PoolMemberInterface<Float32Array>>();

    togglePause = new Event<boolean>();

    private _audioBufferPool = new Pool<AudioOutputBuffer>(
        () => new AudioOutputBuffer(new Float32Array(this.getFrameSize()), this.getSampleRate())
    );

    private _audioBufferMap = new WeakMap<AudioOutputBuffer, PoolMemberInterface<AudioOutputBuffer>>();

    private _pcmDataPool = new InducedPool(
        (buffer: AudioOutputBuffer) => buffer.getContent(),
        (value: PoolMemberInterface<AudioOutputBuffer>, target: Float32Array) =>
            value.get().replaceUnderlyingBuffer(target)
    );
}

export { PCMAudioEndpoint as default };
