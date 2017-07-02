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

import VideoEndpointInterface from './VideoEndpointInterface';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import VideoDriverInterface from './VideoDriverInterface';

const SMOOTHING_PROPS = [
    'imageSmoothingEnabled',
    'mozImageSmoothingEnabled',
    'webkitImageSmoothingEnabled',
    'msImageSmoothingEnabled'
];

const INITIAL_RENDER_CANVAS_SIZE = 100;

export default class SimpleCanvasVideo implements VideoDriverInterface {

    constructor(
        private _canvas: HTMLCanvasElement,
        private _aspect = 4 / 3
    ) {
        this._context = this._canvas.getContext('2d');

        this._renderCanvas = document.createElement('canvas');
        this._renderCanvas.width = this._renderCanvas.height = INITIAL_RENDER_CANVAS_SIZE;
        this._renderContext = this._renderCanvas.getContext('2d');
    }

    resize(width?: number, height?: number): this {
        if (typeof(width) === 'undefined' || typeof(height) === 'undefined') {
            width = this._canvas.clientWidth;
            height = this._canvas.clientHeight;
        }

        this._canvas.width = width;
        this._canvas.height = height;

        this._clearCanvas();
        this._recalculateBlittingMetrics();
        this._applyInterpolationSettings();

        if (this._video) {
            this._blitToCanvas();
        }

        return this;
    }

    init(): this {
        this.enableInterpolation(true);
        this._clearRenderCanvas();
        this.resize();

        return this;
    }

    setThrottle(throttle: boolean) {
        if (throttle === this._throttle) {
            return;
        }

        this._cancelPendingFrame();

        this._throttle = throttle;
    }

    bind(video: VideoEndpointInterface): this {
        if (this._video) {
            return;
        }

        this._video = video;

        this._videoWidth = this._renderCanvas.width = this._video.getWidth();
        this._videoHeight = this._renderCanvas.height = this._video.getHeight();

        this.resize();
        this._clearRenderCanvas();

        this._video.newFrame.addHandler(SimpleCanvasVideo._frameHandler, this);

        return this;
    }

    unbind(): this {
        if (!this._video) {
            return;
        }

        this._video.newFrame.removeHandler(SimpleCanvasVideo._frameHandler, this);
        this._video = null;

        this._cancelPendingFrame();
        this._clearCanvas();

        return this;
    }

    enableInterpolation(enable: boolean): this {
        if (this._interpolate === enable) {
            return this;
        }

        this._interpolate = enable;

        this._applyInterpolationSettings();

        return this;
    }

    interpolationEnabled(): boolean {
        return this._interpolate;
    }

    getCanvas(): HTMLCanvasElement {
        return this._canvas;
    }

    private static _frameHandler(imageDataPoolMember: PoolMemberInterface<ImageData>, self: SimpleCanvasVideo): void {
        if (self._pendingFrame) {
            self._pendingFrame.release();
        }

        self._pendingFrame = imageDataPoolMember;

        if (self._throttle)  {
            if (!self._animationFrameHandle) {
                self._scheduleDraw();
            }
        } else {
            self._draw();
        }
    }

    private _clearCanvas(): void {
        this._context.fillStyle = 'solid black';
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    private _clearRenderCanvas(): void {
        this._renderContext.fillStyle = 'solid black';
        this._renderContext.fillRect(0, 0, this._renderCanvas.width, this._renderCanvas.height);
    }

    private _draw(): void {
        this._blitToRenderCanvas();
        this._blitToCanvas();

        this._pendingFrame.release();
        this._pendingFrame = null;
    }

    private _blitToRenderCanvas(): void {
        this._renderContext.putImageData(this._pendingFrame.get(), 0, 0);
    }

    private _blitToCanvas(): void {
        this._context.drawImage(
            this._renderCanvas,
            0,
            0,
            this._videoWidth,
            this._videoHeight,
            this._renderX,
            this._renderY,
            this._renderWidth,
            this._renderHeight
        );
    }

    private _scheduleDraw(): void {
        if (!this._animationFrameHandle) {
            this._animationFrameHandle = requestAnimationFrame(() => {
                this._draw();
                this._animationFrameHandle = 0;
            });
        }
    }

    private _cancelPendingFrame(): void {
        if (this._animationFrameHandle) {
            cancelAnimationFrame(this._animationFrameHandle);
            this._animationFrameHandle = 0;
        }

        if (this._pendingFrame) {
            this._pendingFrame.release();
            this._pendingFrame = null;
        }
    }

    private _recalculateBlittingMetrics(): void {
        const targetWidth = this._canvas.width,
            targetHeight = this._canvas.height;

        if (this._aspect * targetHeight <= targetWidth) {
            this._renderHeight = targetHeight;
            this._renderWidth = this._aspect * targetHeight;
            this._renderY = 0;
            this._renderX = Math.floor((targetWidth - this._renderWidth) / 2);
        } else {
            this._renderHeight = targetWidth / this._aspect;
            this._renderWidth = targetWidth;
            this._renderY = Math.floor((targetHeight - this._renderHeight) / 2);
            this._renderX = 0;
        }
    }

    private _applyInterpolationSettings(): void {
        for (const prop of SMOOTHING_PROPS) {
            (this._context as any)[prop] = this._interpolate;
        }
    }

    private _throttle = true;
    private _animationFrameHandle = 0;
    private _pendingFrame: PoolMemberInterface<ImageData> = null;

    private _context: CanvasRenderingContext2D;
    private _video: VideoEndpointInterface = null;

    private _renderCanvas: HTMLCanvasElement;
    private _renderContext: CanvasRenderingContext2D;

    private _interpolate = true;

    private _renderX: number;
    private _renderY: number;
    private _renderWidth: number;
    private _renderHeight: number;

    private _videoWidth: number;
    private _videoHeight: number;
}
