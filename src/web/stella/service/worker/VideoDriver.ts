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

import { Mutex } from 'async-mutex';
import { RpcProviderInterface, RpcProvider } from 'worker-rpc';

import VideoOutputInterface from '../../../../machine/io/VideoOutputInterface';
import ObjectPool from '../../../../tools/pool/Pool';
import ObjectPoolMember from '../../../../tools/pool/PoolMember';
import ArrayBufferSurface from '../../../../video/surface/ArrayBufferSurface';
import VideoPipelineClient from '../../../../video/processing/worker/PipelineClient';
import { ProcessorConfig as VideoProcessorConfig } from '../../../../video/processing/config';

import {
    SIGNAL_TYPE,
    RPC_TYPE,
    VideoNewFrameMessage,
    VideoReturnSurfaceMessage,
    VideoParametersResponse
} from './messages';

class VideoDriver {
    constructor(private _rpc: RpcProviderInterface) {}

    init(videoPipelinePort?: MessagePort): void {
        this._rpc
            .registerSignalHandler(SIGNAL_TYPE.videoReturnSurface, this._onReturnSurfaceFromHost.bind(this))
            .registerRpcHandler(RPC_TYPE.getVideoParameters, this._onGetVideoParameters.bind(this));

        if (videoPipelinePort) {
            const videoPipelineRpc = new RpcProvider((data: any, transfer?: any) =>
                videoPipelinePort.postMessage(data, transfer)
            );
            videoPipelinePort.onmessage = (e: MessageEvent) => videoPipelineRpc.dispatch(e.data);

            this._videoPipelineClient = new VideoPipelineClient(videoPipelineRpc);

            this._videoPipelineClient.emit.addHandler(VideoDriver._onEmitFromPipeline, this);
        }
    }

    setVideoProcessingConfig(config: Array<VideoProcessorConfig>): void {
        this._videoProcessingConfig = config;
    }

    bind(video: VideoOutputInterface): void {
        this._mutex.runExclusive(() => this._bind(video));
    }

    unbind(): void {
        this._mutex.runExclusive(() => this._unbind());
    }

    private static _onEmitFromPipeline(surface: ObjectPoolMember<ArrayBufferSurface>, self: VideoDriver) {
        if (!self._active) {
            console.warn('surface emmited from pipeline to inactive driver');
            return;
        }

        if (!self._ids.has(surface)) {
            console.warn('surface not registered');
            return;
        }

        const buffer = surface.get().getUnderlyingBuffer(),
            id = self._ids.get(surface);

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

    private static _onNewFrame(surface: ArrayBufferSurface, self: VideoDriver): void {
        if (!self._active) {
            console.warn('new frame passed to inactive driver');
            return;
        }

        if (!self._managedSurfaces.has(surface)) {
            console.warn(`surface not registered`);
            return;
        }

        if (self._bypassProcessingPipeline || !self._videoPipelineClient) {
            VideoDriver._onEmitFromPipeline(self._managedSurfaces.get(surface), self);
        } else {
            self._videoPipelineClient.processSurface(self._managedSurfaces.get(surface));
        }
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

        if (this._videoPipelineClient) {
            await this._videoPipelineClient.configure(this._width, this._height, this._videoProcessingConfig);
        }

        this._video.setSurfaceFactory((): ArrayBufferSurface => {
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
        });

        this._video.newFrame.addHandler(VideoDriver._onNewFrame, this);

        this._bypassProcessingPipeline = !this._videoProcessingConfig || this._videoProcessingConfig.length === 0;
        this._active = true;
    }

    private async _unbind(): Promise<void> {
        if (!this._active) {
            return;
        }
        this._active = false;

        this._video.setSurfaceFactory(null);
        this._video.newFrame.removeHandler(VideoDriver._onNewFrame, this);

        if (this._videoPipelineClient) {
            await this._videoPipelineClient.flush();
        }

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

    private _videoPipelineClient: VideoPipelineClient = null;
    private _mutex = new Mutex();
    private _videoProcessingConfig: Array<VideoProcessorConfig> = null;
    private _bypassProcessingPipeline = true;

    private _surfacePool: ObjectPool<ArrayBufferSurface> = null;
    private _managedSurfacesById: Map<number, ObjectPoolMember<ArrayBufferSurface>> = null;
    private _managedSurfaces: WeakMap<ArrayBufferSurface, ObjectPoolMember<ArrayBufferSurface>>;
    private _ids: WeakMap<ObjectPoolMember<ArrayBufferSurface>, number> = null;
    private _width = 0;
    private _height = 0;

    private _nextId = 0;
}

export default VideoDriver;
