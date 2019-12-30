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
