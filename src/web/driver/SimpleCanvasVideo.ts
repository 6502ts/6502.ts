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

import VideoEndpointInterface from './VideoEndpointInterface';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';

export default class SimpleCanvasVideo {

    constructor(
        private _canvas: HTMLCanvasElement
    ) {
        this._context = this._canvas.getContext('2d');
    }

    init(): void {
        this._clearCanvas();
    }

    bind(video: VideoEndpointInterface): void {
        if (this._video) {
            return;
        }

        this._video = video;

        this._canvas.width = this._video.getWidth();
        this._canvas.height = this._video.getHeight();
        this._clearCanvas();

        this._video.newFrame.addHandler(SimpleCanvasVideo._frameHandler, this);
    }

    unbind(): void {
        if (!this._video) {
            return;
        }

        this._video.newFrame.removeHandler(SimpleCanvasVideo._frameHandler, this);
        this._video = null;

        this._clearCanvas();
    }

    private static _frameHandler(imageDataPoolMember: PoolMemberInterface<ImageData>, self: SimpleCanvasVideo): void {
        self._context.putImageData(imageDataPoolMember.get(), 0, 0);

        imageDataPoolMember.release();
    }

    private _clearCanvas(): void {
        this._context.fillStyle = 'solid black';
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    private _context: CanvasRenderingContext2D;
    private _video: VideoEndpointInterface = null;
}
