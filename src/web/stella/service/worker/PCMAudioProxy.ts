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
