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

import { Mutex } from 'async-mutex';
import { RpcProviderInterface } from 'worker-rpc';

import VideoOutputInterface from '../../../../machine/io/VideoOutputInterface';
import ObjectPool from '../../../../tools/pool/Pool';
import ObjectPoolMember from '../../../../tools/pool/PoolMember';
import ArrayBufferSurface from '../../../../video/surface/ArrayBufferSurface';

import {
    SIGNAL_TYPE,
    RPC_TYPE,
    VideoNewFrameMessage,
    VideoReturnSurfaceMessage,
    VideoParametersResponse
} from './messages';

class VideoDriver {
    constructor(private _rpc: RpcProviderInterface) {}

    init(): void {
        this._rpc
            .registerSignalHandler(SIGNAL_TYPE.videoReturnSurface, this._onReturnSurfaceFromHost.bind(this))
            .registerRpcHandler(RPC_TYPE.getVideoParameters, this._onGetVideoParameters.bind(this));
    }

    bind(video: VideoOutputInterface): void {
        this._mutex.runExclusive(() => this._bind(video));
    }

    unbind(): void {
        this._mutex.runExclusive(() => this._unbind());
    }

    private static _onNewFrame(surface: ArrayBufferSurface, self: VideoDriver): void {
        if (!self._active) {
            console.warn('new frame passed to inactive driver');
            return;
        }

        if (!self._managedSurfaces.has(surface)) {
            console.warn(`surface not registered`);
            return;
        }

        const buffer = surface.getUnderlyingBuffer(),
            id = self._ids.get(self._managedSurfaces.get(surface));

        self._rpc.signal<VideoNewFrameMessage>(
            SIGNAL_TYPE.videoNewFrame,
            {
                id,
                width: self._width,
                height: self._height,
                buffer
            },
            [buffer]
        );
    }

    private async _bind(video: VideoOutputInterface): Promise<void> {
        if (this._active) {
            return;
        }

        this._width = video.getWidth();
        this._height = video.getHeight();
        this._video = video;

        this._surfacePool = new ObjectPool<ArrayBufferSurface>(() =>
            ArrayBufferSurface.createFromArrayBuffer(
                this._width,
                this._height,
                new ArrayBuffer(4 * this._width * this._height)
            )
        );
        this._managedSurfacesById = new Map<number, ObjectPoolMember<ArrayBufferSurface>>();
        this._managedSurfaces = new WeakMap<ArrayBufferSurface, ObjectPoolMember<ArrayBufferSurface>>();
        this._ids = new WeakMap<ObjectPoolMember<ArrayBufferSurface>, number>();

        this._video.setSurfaceFactory(
            (): ArrayBufferSurface => {
                const managedSurface = this._surfacePool.get(),
                    surface = managedSurface.get();

                const isNewSurface = !this._ids.has(managedSurface);

                if (isNewSurface) {
                    const id = this._nextId++;

                    this._ids.set(managedSurface, id);
                    this._managedSurfacesById.set(id, managedSurface);
                    this._managedSurfaces.set(surface, managedSurface);

                    surface.fill(0xff000000);
                }

                return managedSurface.get();
            }
        );

        this._video.newFrame.addHandler(VideoDriver._onNewFrame, this);

        this._active = true;
    }

    private async _unbind(): Promise<void> {
        if (!this._active) {
            return;
        }
        this._active = false;

        this._video.setSurfaceFactory(null);
        this._video.newFrame.removeHandler(VideoDriver._onNewFrame, this);

        this._video = null;
        this._surfacePool = null;
        this._managedSurfacesById = null;
        this._ids = null;
    }

    private _onReturnSurfaceFromHost(message: VideoReturnSurfaceMessage): void {
        if (!this._active) {
            console.warn('surface returned from host to inactive driver');
            return;
        }

        const surface = this._managedSurfacesById.get(message.id);

        if (!surface) {
            console.warn(`invalid member ID ${message.id}`);
            return;
        }

        surface.get().replaceUnderlyingBuffer(this._width, this._height, message.buffer);
        surface.release();
    }

    private _onGetVideoParameters(): VideoParametersResponse {
        return {
            width: this._width,
            height: this._height
        };
    }

    private _active = false;

    private _video: VideoOutputInterface = null;

    private _mutex = new Mutex();

    private _surfacePool: ObjectPool<ArrayBufferSurface> = null;
    private _managedSurfacesById: Map<number, ObjectPoolMember<ArrayBufferSurface>> = null;
    private _managedSurfaces: WeakMap<ArrayBufferSurface, ObjectPoolMember<ArrayBufferSurface>>;
    private _ids: WeakMap<ObjectPoolMember<ArrayBufferSurface>, number> = null;
    private _width = 0;
    private _height = 0;

    private _nextId = 0;
}

export { VideoDriver as default };
