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

import VideoOutputInterface from '../../../../machine/io/VideoOutputInterface';
import ObjectPool from '../../../../tools/pool/Pool';
import ObjectPoolMember from '../../../../tools/pool/PoolMember';
import ArrayBufferSurface from '../../../../video/surface/ArrayBufferSurface';
import {RpcProviderInterface} from 'worker-rpc';

import {
    SIGNAL_TYPE,
    VideoNewFrameMessage,
    VideoReturnSurfaceMessage
} from './messages';

class VideoDriver {

    constructor (
        private _rpc: RpcProviderInterface
    ) {}

    init(): void {
        this._rpc.registerSignalHandler(SIGNAL_TYPE.videoReturnSurface, this._onReturnSurface.bind(this));
    }

    bind(video: VideoOutputInterface): void {
        if (this._active) {
            return;
        }

        this._active = true;
        this._video = video;
        this._width = video.getWidth();
        this._height = video.getHeight();

        this._pool = new ObjectPool<ArrayBuffer>(
            () => new ArrayBuffer(4 * this._width * this._height)
        );

        this._members = {};
        this._ids = new WeakMap<ArrayBuffer, number>();

        this._video.setSurfaceFactory(
            (): ArrayBufferSurface => {
                const member = this._pool.get(),
                    buffer = member.get();

                if (!buffer) {
                    return null;
                }

                const isNewBuffer = !this._ids.has(buffer);

                if (isNewBuffer) {
                    const id = this._nextId++;

                    this._ids.set(buffer, id);
                    this._members[id] = member;
                }

                const newSurface = ArrayBufferSurface.createFromArrayBuffer(this._width, this._height, buffer);

                if (isNewBuffer) {
                    newSurface.fill(0xFF000000);
                }

                return newSurface;
            }
        );

        this._video.newFrame.addHandler(VideoDriver._onNewFrame, this);
    }

    unbind(): void {
        if (!this._active) {
            return;
        }

        this._video.setSurfaceFactory(null);
        this._video.newFrame.removeHandler(VideoDriver._onNewFrame, this);

        this._active = false;
        this._video = null;
        this._pool = null;
        this._members = null;
        this._ids = null;
    }

    private _onReturnSurface(message: VideoReturnSurfaceMessage): void {
        if (!this._active) {
            console.warn('surface returned to inactive driver');
            return;
        }

        const member = this._members[message.id];

        if (!member) {
            console.warn(`invalid member ID ${message.id}`);
            return;
        }

        member.adopt(message.buffer);
        member.release();

        this._ids.set(message.buffer, message.id);
    }

    private static _onNewFrame(surface: ArrayBufferSurface, self: VideoDriver) {
        const buffer = surface.getUnderlyingBuffer();

        if (!self._ids.has(buffer)) {
            throw new Error(`buffer not registered`);
        }

        const id = self._ids.get(buffer);

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

    private _active = false;

    private _video: VideoOutputInterface = null;

    private _pool: ObjectPool<ArrayBuffer> = null;
    private _members: {[id: number]: ObjectPoolMember<ArrayBuffer>} = null;
    private _ids: WeakMap<ArrayBuffer, number> = null;
    private _width = 0;
    private _height = 0;

    private _nextId = 0;
}

export default VideoDriver;
