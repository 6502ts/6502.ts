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

import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import { RpcProviderInterface } from 'worker-rpc';
import PoolMemberInterface from '../../../../tools/pool/PoolMemberInterface';

import {
    SIGNAL_TYPE,
    RPC_TYPE,
    VideoNewFrameMessage,
    VideoReturnSurfaceMessage,
    VideoParametersResponse
} from './messages';

class VideoProxy implements VideoEndpointInterface {
    constructor(private _rpc: RpcProviderInterface) {}

    init(): void {
        this._rpc.registerSignalHandler(SIGNAL_TYPE.videoNewFrame, this._onNewFrame.bind(this));
    }

    async start(): Promise<void> {
        if (this._active) {
            this.stop();
        }

        const videoParameters = await this._rpc.rpc<void, VideoParametersResponse>(RPC_TYPE.getVideoParameters);

        this._active = true;
        this._width = videoParameters.width;
        this._height = videoParameters.height;
        this._ids = new Set<number>();
    }

    stop(): void {
        this._active = false;
        this._ids = null;
    }

    getWidth(): number {
        return this._width;
    }

    getHeight(): number {
        return this._height;
    }

    private _onNewFrame(message: VideoNewFrameMessage): void {
        if (!this._active) {
            console.warn('video proxy deactivated: ignoring frame');
            return;
        }

        if (this._width !== message.width || this._height !== message.height) {
            console.warn(`surface dimensions do not match; ignoring frame`);
            return;
        }

        this._ids.add(message.id);

        const imageData = new ImageData(new Uint8ClampedArray(message.buffer), message.width, message.height);

        this.newFrame.dispatch({
            get: () => imageData,

            release: () => {
                if (this._active && this._ids.has(message.id)) {
                    this._rpc.signal<VideoReturnSurfaceMessage>(
                        SIGNAL_TYPE.videoReturnSurface,
                        {
                            id: message.id,
                            buffer: message.buffer
                        },
                        [message.buffer]
                    );
                }
            },

            dispose: () => undefined,

            adopt: () => {
                throw new Error('adopt is not implemented');
            }
        });
    }

    newFrame = new Event<PoolMemberInterface<ImageData>>();

    private _active = false;
    private _width = 0;
    private _height = 0;
    private _ids: Set<number> = null;
}

export { VideoProxy as default };
