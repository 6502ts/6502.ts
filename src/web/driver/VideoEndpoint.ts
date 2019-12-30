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

import VideoOutputInterface from '../..//machine/io/VideoOutputInterface';
import ObjectPool from '../../tools/pool/Pool';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import ArrayBufferSurface from '../../video/surface/ArrayBufferSurface';
import RGBASurfaceInterface from '../../video/surface/RGBASurfaceInterface';
import VideoEndpointInterface from '../driver/VideoEndpointInterface';
import InducedPool from '../../tools/pool/InducedPool';

import VideoProcessorPipeline from '../../video/processing/ProcessorPipeline';
import * as VideoProcessorConfig from '../../video/processing/config';
import VideoProcessorInterface from '../../video/processing/ProcessorInterface';

class VideoEndpoint implements VideoEndpointInterface {
    constructor(private _video: VideoOutputInterface, videoProcessing?: Array<VideoProcessorConfig.ProcessorConfig>) {
        this._videoProcessor = new VideoProcessorPipeline(videoProcessing);
        this._videoProcessor.init(this._video.getWidth(), this._video.getHeight());

        this._pool = new ObjectPool<ImageData>(() => new ImageData(this._video.getWidth(), this._video.getHeight()));

        this._video.setSurfaceFactory((): RGBASurfaceInterface => {
            const poolMember = this._pool.get(),
                imageData = poolMember.get();

            if (!this._surfaces.has(imageData)) {
                const newSurface = ArrayBufferSurface.createFromArrayBuffer(
                    imageData.width,
                    imageData.height,
                    imageData.data.buffer
                );

                this._surfaces.set(imageData, newSurface.fill(0xff000000));
            }

            const surface = this._surfaces.get(imageData);

            this._poolMembers.set(surface, poolMember);

            return surface;
        });

        this._video.newFrame.addHandler(imageData =>
            this._videoProcessor.processSurface(this._surfacePool.get(this._poolMembers.get(imageData)))
        );

        this._videoProcessor.emit.addHandler(wrappedSurface =>
            this.newFrame.dispatch(this._poolMembers.get(wrappedSurface.get()))
        );
    }

    getWidth(): number {
        return this._video.getWidth();
    }

    getHeight(): number {
        return this._video.getHeight();
    }

    newFrame = new Event<PoolMemberInterface<ImageData>>();

    private _pool: ObjectPool<ImageData>;
    private _poolMembers = new WeakMap<RGBASurfaceInterface, PoolMemberInterface<ImageData>>();
    private _surfaces = new WeakMap<ImageData, RGBASurfaceInterface>();
    private _surfacePool = new InducedPool<ImageData, RGBASurfaceInterface>(imageData => this._surfaces.get(imageData));

    private _videoProcessor: VideoProcessorInterface;
}

export { VideoEndpoint as default };
