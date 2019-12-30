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

import { RpcProviderInterface } from 'worker-rpc';
import { Event } from 'microevent.ts';

import Pool from '../../../../tools/pool/Pool';
import PoolMemberInterface from '../../../../tools/pool/PoolMemberInterface';
import PCMAudioEndpointInterface from '../../../driver/PCMAudioEndpointInterface';
import {
    SIGNAL_TYPE,
    RPC_TYPE,
    PCMAudioReturnFrameMessage,
    PCMAudioNewFrameMessage,
    PCMAudioTogglePauseMessage,
    PCMAudioParametersResponse
} from './messages';

class PCMAudioProxy implements PCMAudioEndpointInterface {
    constructor(private _index: number, private _rpc: RpcProviderInterface) {
        this._framePool.event.release.addHandler(PCMAudioProxy._onReleaseFragment, this);

        this._signalReturnFrame = SIGNAL_TYPE.pcmAudioReturnFrame(this._index);
    }

    init(): this {
        this._rpc
            .registerSignalHandler(SIGNAL_TYPE.pcmAudioNewFrame(this._index), this._onNewFrame.bind(this))
            .registerSignalHandler(SIGNAL_TYPE.pcmAudioTogglePause(this._index), this._onTogglePause.bind(this));

        return this;
    }

    async start(): Promise<void> {
        if (this._enabled) {
            return;
        }

        const params = await this._rpc.rpc<void, PCMAudioParametersResponse>(
            RPC_TYPE.getPCMAudioParameters(this._index)
        );

        this._sampleRate = params.sampleRate;
        this._frameSize = params.frameSize;
        this._paused = params.paused;

        this._enabled = true;
    }

    stop(): void {
        this._enabled = false;
    }

    isPaused(): boolean {
        return this._paused;
    }

    getSampleRate(): number {
        return this._sampleRate;
    }

    getFrameSize(): number {
        return this._frameSize;
    }

    private static _onReleaseFragment(frame: Float32Array, self: PCMAudioProxy): void {
        if (!self._frameMap.has(frame)) {
            return;
        }

        self._rpc.signal<PCMAudioReturnFrameMessage>(
            self._signalReturnFrame,
            {
                id: self._frameMap.get(frame),
                buffer: frame.buffer
            },
            [frame.buffer]
        );
    }

    private _onNewFrame(msg: PCMAudioNewFrameMessage): void {
        if (!this._enabled) {
            return;
        }

        const frame = this._framePool.get(),
            data = new Float32Array(msg.buffer);

        frame.adopt(data);
        this._frameMap.set(data, msg.id);

        this.newFrame.dispatch(frame);
    }

    private _onTogglePause(msg: PCMAudioTogglePauseMessage): void {
        if (msg.paused === this._paused) {
            return;
        }

        this._paused = msg.paused;
        this.togglePause.dispatch(this._paused);
    }

    newFrame = new Event<PoolMemberInterface<Float32Array>>();

    togglePause = new Event<boolean>();

    private _sampleRate = 0;
    private _frameSize = 0;
    private _paused = false;

    private _framePool = new Pool<Float32Array>(() => null);
    private _frameMap = new WeakMap<Float32Array, number>();

    private _enabled = false;

    private _signalReturnFrame = '';
}

export { PCMAudioProxy as default };
