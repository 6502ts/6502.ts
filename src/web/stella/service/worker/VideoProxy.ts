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

import { Event } from 'microevent.ts';

import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import { RpcProviderInterface } from 'worker-rpc';
import PoolMemberInterface from '../../../../tools/pool/PoolMemberInterface';

import { SIGNAL_TYPE, VideoNewFrameMessage, VideoReturnSurfaceMessage } from './messages';

class VideoProxy implements VideoEndpointInterface {
    constructor(private _rpc: RpcProviderInterface) {}

    init(): void {
        this._rpc.registerSignalHandler(SIGNAL_TYPE.videoNewFrame, this._onNewFrame.bind(this));
    }

    enable(width: number, height: number): void {
        if (this._active) {
            this.disable();
        }

        this._active = true;
        this._width = width;
        this._height = height;
        this._ids = new Set<number>();
    }

    disable(): void {
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

            dispose: () => undefined
        });
    }

    newFrame = new Event<PoolMemberInterface<ImageData>>();

    private _active = false;
    private _width = 0;
    private _height = 0;
    private _ids: Set<number> = null;
}

export default VideoProxy;
