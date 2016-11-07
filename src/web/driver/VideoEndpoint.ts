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


import {Event} from 'microevent.ts';

import VideoOutputInterface from '../..//machine/io/VideoOutputInterface';
import ObjectPool from '../../tools/pool/Pool';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import ArrayBufferSurface from '../../tools/surface/ArrayBufferSurface';
import RGBASurfaceInterface from '../../tools/surface/RGBASurfaceInterface';
import VideoEndpointInterface from '../driver/VideoEndpointInterface';

class VideoEndpoint implements VideoEndpointInterface {

    constructor(
        private _video: VideoOutputInterface
    ) {
        this._pool = new ObjectPool<ImageData>(
            () => new ImageData(this._video.getWidth(), this._video.getHeight())
        );

        this._video.setSurfaceFactory(
            (): RGBASurfaceInterface => {
                const poolMember = this._pool.get(),
                    imageData = poolMember.get();

                if (!this._surfaces.has(imageData)) {
                    const newSurface = new ArrayBufferSurface(imageData.width, imageData.height, imageData.data.buffer);

                    this._surfaces.set(
                        imageData,
                        newSurface.fill(0xFF000000)
                    );
                }

                const surface = this._surfaces.get(imageData);

                this._poolMembers.set(surface, poolMember);

                return surface;
            }
        );

        this._video.newFrame.addHandler(
            surface => this.newFrame.dispatch(this._poolMembers.get(surface))
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
}

export default VideoEndpoint;
