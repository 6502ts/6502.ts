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

import VideoEndpointInterface from './VideoEndpointInterface';
import { fsh, vsh } from './video/shader';
import Program from './video/Program';
import PoolMemberInterface from '../../tools/pool/PoolMemberInterface';
import PhosphorProcessor from './video/PhosphorProcessor';
import NtscProcessor from './video/NtscProcessor';
import ScanlineProcessor from './video/ScanlineProcessor';
import IntegerScalingProcessor from './video/IntegerScalingProcessor';
import RingBuffer from '../../tools/RingBuffer';
import Processor from './video/Processor';

const MAX_CONSECUTIVE_UNDERFLOWS = 5;

class WebglVideo {
    constructor(canvas: HTMLCanvasElement, config: Partial<WebglVideo.Config> = {}) {
        const defaultConfig: WebglVideo.Config = {
            gamma: 1,
            scalingMode: WebglVideo.ScalingMode.qis,
            phosphorLevel: 0.5,
            scanlineLevel: 0.3,
            tvEmulation: WebglVideo.TvEmulation.composite
        };

        this._config = {
            ...defaultConfig,
            ...config
        };

        const contextOptions: WebGLContextAttributes = {
            alpha: false,
            depth: false,
            antialias: false
        };

        this._gl = canvas.getContext('webgl', contextOptions);

        if (!this._gl) {
            this._gl = canvas.getContext('experimental-webgl', contextOptions) as any;
        }

        if (!this._gl) {
            throw new Error('unable to acquire webgl context');
        }

        this._phosphorProcessor = new PhosphorProcessor(this._gl);
        this._ntscProcessor = new NtscProcessor(this._gl);
        this._scanlineProcessor = new ScanlineProcessor(this._gl);
        this._integerScalingProcessor = new IntegerScalingProcessor(this._gl);

        this._pendingFrames.evict.addHandler(frame => frame.release());
    }

    init(): this {
        this._updateCanvasSize();

        this._mainProgram = Program.compile(this._gl, vsh.plain.source, fsh.blitWithGamma.source);

        this._mainProgram.use();
        this._mainProgram.uniform1i(fsh.blitWithGamma.uniform.textureUnit, 0);

        this._createVertexCoordinateBuffer();
        this._createTextureCoordinateBuffer();
        this._configureSourceTexture();

        this._applyConfiguration();

        return this;
    }

    close(): this {
        const gl = this._gl;

        this._mainProgram.delete();
        gl.deleteBuffer(this._vertexCoordinateBuffer);
        gl.deleteBuffer(this._textureCoordinateBuffer);
        gl.deleteTexture(this._sourceTexture);

        this._ntscProcessor.destroy();
        this._phosphorProcessor.destroy();
        this._scanlineProcessor.destroy();
        this._integerScalingProcessor.destroy();

        return this;
    }

    resize(width?: number, height?: number): this {
        this._updateCanvasSize(width, height);
        this._updateVertexBuffer();

        if (this._video) {
            this._configureProcessors();
            this._scheduleDraw();
        }

        if (this._hasFrame) this._draw();

        return this;
    }

    getCanvas(): HTMLCanvasElement {
        return this._gl.canvas as HTMLCanvasElement;
    }

    bind(video: VideoEndpointInterface): this {
        if (this._video) {
            return this;
        }

        this._video = video;
        this._video.newFrame.addHandler(WebglVideo._frameHandler, this);

        this._configureProcessors();

        this._scheduleDraw();

        return this;
    }

    unbind(): this {
        if (!this._video) {
            return this;
        }

        this._cancelDraw();
        this._video.newFrame.removeHandler(WebglVideo._frameHandler, this);
        this._video = null;

        this._pendingFrames.forEach(f => f.release());
        this._pendingFrames.clear();

        return this;
    }

    getConfig(): WebglVideo.Config {
        return this._config;
    }

    updateConfig(config: Partial<WebglVideo.Config>): this {
        return this;
    }

    private static _frameHandler(imageDataPoolMember: PoolMemberInterface<ImageData>, self: WebglVideo): void {
        if (self._pendingFrames.size() === self._pendingFrames.capacity()) {
            self._pendingFrames.forEach(f => f.release());
            self._pendingFrames.clear();
        }

        self._pendingFrames.push(imageDataPoolMember);

        self._scheduleDraw();
    }

    private _scheduleDraw(): void {
        if (this._anmiationFrameHandle !== 0) {
            return;
        }

        this._anmiationFrameHandle = requestAnimationFrame(() => this._onAnimationFrame());
    }

    private _cancelDraw(): void {
        if (this._anmiationFrameHandle !== 0) {
            cancelAnimationFrame(this._anmiationFrameHandle);
        }

        this._anmiationFrameHandle = 0;
    }

    private _onAnimationFrame(): void {
        const gl = this._gl;
        this._anmiationFrameHandle = 0;

        if (this._pendingFrames.size() === 0) {
            if (this._consecutiveUnderflows++ <= MAX_CONSECUTIVE_UNDERFLOWS) {
                this._scheduleDraw();
            }

            return;
        }

        this._consecutiveUnderflows = 0;
        this._scheduleDraw();

        const frame = this._pendingFrames.pop();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._sourceTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame.get());

        frame.release();

        this._hasFrame = true;

        this._draw();
    }

    private _draw(): void {
        const gl = this._gl;

        let texture = this._sourceTexture;

        for (const processor of this._processors) {
            processor.render(texture);
            texture = processor.getTexture();
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            this._config.scalingMode === WebglVideo.ScalingMode.none ? gl.NEAREST : gl.LINEAR
        );
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MAG_FILTER,
            this._config.scalingMode === WebglVideo.ScalingMode.none ? gl.NEAREST : gl.LINEAR
        );

        this._mainProgram.use();
        this._mainProgram.bindVertexAttribArray(
            vsh.plain.attribute.vertexPosition,
            this._vertexCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        this._mainProgram.bindVertexAttribArray(
            vsh.plain.attribute.textureCoordinate,
            this._textureCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    private _createVertexCoordinateBuffer(): void {
        const gl = this._gl,
            targetWidth = gl.drawingBufferWidth,
            targetHeight = gl.drawingBufferHeight,
            scaleX = targetWidth > 0 ? 2 / targetWidth : 1,
            scaleY = targetHeight > 0 ? 2 / targetHeight : 1;

        let width: number, height: number, west: number, north: number;

        if ((4 / 3) * targetHeight <= targetWidth) {
            height = 2;
            width = (4 / 3) * targetHeight * scaleX;
            north = 1;
            west = (Math.floor((-4 / 3) * targetHeight) / 2) * scaleX;
        } else {
            height = (targetWidth / (4 / 3)) * scaleY;
            width = 2;
            north = (Math.floor(targetWidth / (4 / 3)) / 2) * scaleY;
            west = -1;
        }

        const vertexData = [west + width, north, west, north, west + width, north - height, west, north - height];

        this._vertexCoordinateBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    }

    private _updateVertexBuffer(): void {
        this._gl.deleteBuffer(this._vertexCoordinateBuffer);
        this._createVertexCoordinateBuffer();
    }

    private _createTextureCoordinateBuffer(): void {
        const gl = this._gl;
        const textureCoordinateData = [1, 1, 0, 1, 1, 0, 0, 0];

        this._textureCoordinateBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinateData), gl.STATIC_DRAW);
    }

    private _updateCanvasSize(width?: number, height?: number): void {
        if (typeof width === 'undefined' || typeof height === 'undefined') {
            width = this.getCanvas().clientWidth;
            height = this.getCanvas().clientHeight;
        }

        const pixelRatio = window.devicePixelRatio || 1;

        this.getCanvas().width = width * pixelRatio;
        this.getCanvas().height = height * pixelRatio;
    }

    private _configureSourceTexture(): void {
        const gl = this._gl;

        if (!this._sourceTexture) {
            this._sourceTexture = gl.createTexture();
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._sourceTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    }

    private _configureProcessors() {
        if (!this._video) {
            return;
        }

        this._phosphorProcessor.configure(this._config.phosphorLevel);
        this._scanlineProcessor.configure(this._config.scanlineLevel);
        this._integerScalingProcessor.configure(this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);

        let width = this._video.getWidth();
        let height = this._video.getHeight();

        for (const processor of this._processors) {
            processor.resize(width, height);

            width = processor.getWidth();
            height = processor.getHeight();
        }
    }

    private _applyConfiguration(): void {
        this._mainProgram.uniform1f(fsh.blitWithGamma.uniform.gamma, this._config.gamma);

        this._processors = [];

        if (this._config.tvEmulation !== WebglVideo.TvEmulation.none) {
            this._ntscProcessor.init();
            this._processors.push(this._ntscProcessor);
        }

        if (this._config.phosphorLevel > 0) {
            this._phosphorProcessor.init();
            this._processors.push(this._phosphorProcessor);
        }

        if (this._config.scanlineLevel > 0) {
            this._scanlineProcessor.init();
            this._processors.push(this._scanlineProcessor);
        }

        if (this._config.scalingMode === WebglVideo.ScalingMode.qis) {
            this._integerScalingProcessor.init();
            this._processors.push(this._integerScalingProcessor);
        }

        this._configureProcessors();
    }

    private _config: WebglVideo.Config = null;
    private _gl: WebGLRenderingContext = null;
    private _video: VideoEndpointInterface = null;

    private _mainProgram: Program = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;
    private _sourceTexture: WebGLTexture = null;

    private _anmiationFrameHandle = 0;

    private _phosphorProcessor: PhosphorProcessor = null;
    private _ntscProcessor: NtscProcessor = null;
    private _scanlineProcessor: ScanlineProcessor = null;
    private _integerScalingProcessor: IntegerScalingProcessor = null;
    private _processors: Array<Processor> = [];

    private _pendingFrames = new RingBuffer<PoolMemberInterface<ImageData>>(3);
    private _consecutiveUnderflows = 0;
    private _hasFrame = false;
}

namespace WebglVideo {
    export const enum ScalingMode {
        qis = 'qis',
        bilinear = 'bilinear',
        none = 'none'
    }

    export const enum TvEmulation {
        composite = 'composite',
        svideo = 'svideo',
        none = 'none'
    }

    export interface Config {
        gamma: number;
        scalingMode: ScalingMode;
        phosphorLevel: number;
        scanlineLevel: number;
        tvEmulation: TvEmulation;
    }
}

export default WebglVideo;
