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

import PoolMemberInterface from '../../../../tools/pool/PoolMemberInterface';
import PCMAudioEndpointInterface from '../../../driver/PCMAudioEndpointInterface';
import {
    RPC_TYPE,
    SIGNAL_TYPE,
    PCMAudioParametersResponse,
    PCMAudioNewFrameMessage,
    PCMAudioReturnFrameMessage,
    PCMAudioTogglePauseMessage
} from './messages';

class PCMAudioDriver {
    constructor(index: number, private _rpc: RpcProviderInterface) {
        this._rpc
            .registerRpcHandler(RPC_TYPE.getPCMAudioParameters(index), this._onGetPCMAudioParameters.bind(this))
            .registerSignalHandler(SIGNAL_TYPE.pcmAudioReturnFrame(index), this._onReturnFrame.bind(this));

        this._signalNewFrame = SIGNAL_TYPE.pcmAudioNewFrame(index);
        this._signalTogglePause = SIGNAL_TYPE.pcmAudioTogglePause(index);
    }

    bind(endpoint: PCMAudioEndpointInterface): void {
        if (this._enabled) {
            this.unbind();
        }

        this._endpoint = endpoint;

        this._endpoint.newFrame.addHandler(PCMAudioDriver._onNewFrame, this);
        this._endpoint.togglePause.addHandler(PCMAudioDriver._onTogglePause, this);

        this._sampleRate = this._endpoint.getSampleRate();
        this._frameSize = this._endpoint.getFrameSize();

        this._enabled = true;
    }

    unbind(): void {
        if (!this._enabled) {
            return;
        }

        this._endpoint.newFrame.removeHandler(PCMAudioDriver._onNewFrame, this);
        this._endpoint.togglePause.removeHandler(PCMAudioDriver._onTogglePause, this);
        this._endpoint = null;

        this._pendingFrames.clear();

        this._sampleRate = this._frameSize = 0;

        this._enabled = false;
    }

    private static _onNewFrame(frame: PoolMemberInterface<Float32Array>, self: PCMAudioDriver) {
        if (!self._enabled) {
            frame.dispose();
            return;
        }

        const id = self._nextId++,
            data = frame.get();
        self._pendingFrames.set(id, frame);

        self._rpc.signal<PCMAudioNewFrameMessage>(
            self._signalNewFrame,
            {
                id,
                buffer: data.buffer
            },
            [data.buffer]
        );
    }

    private static _onTogglePause(paused: boolean, self: PCMAudioDriver) {
        self._paused = paused;

        self._rpc.signal<PCMAudioTogglePauseMessage>(self._signalTogglePause, {
            paused
        });
    }

    private _onGetPCMAudioParameters(): PCMAudioParametersResponse {
        return {
            sampleRate: this._sampleRate,
            frameSize: this._frameSize,
            paused: this._paused
        };
    }

    private _onReturnFrame(msg: PCMAudioReturnFrameMessage): void {
        if (!this._enabled || !this._pendingFrames.has(msg.id)) {
            return;
        }

        const frame = this._pendingFrames.get(msg.id);
        this._pendingFrames.delete(msg.id);

        frame.adopt(new Float32Array(msg.buffer));
        frame.release();
    }

    private _enabled = false;

    private _endpoint: PCMAudioEndpointInterface;
    private _sampleRate = 0;
    private _frameSize = 0;

    private _pendingFrames = new Map<number, PoolMemberInterface<Float32Array>>();
    private _nextId = 0;

    private _paused = false;

    private _signalNewFrame = '';
    private _signalTogglePause = '';
}

export { PCMAudioDriver as default };
