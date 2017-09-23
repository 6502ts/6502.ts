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

import * as fs from 'fs';

import PoolMemberInterface from '../../../tools/pool/PoolMemberInterface';
import VideoEndpointInterface from '../VideoEndpointInterface';
import VideoDriverInterface from '../VideoDriverInterface';

const fragmentShaderPovSource = fs.readFileSync(__dirname + '/shader/render_pov.fsh', 'utf-8');
const fragmentSahderPlainSource = fs.readFileSync(__dirname + '/shader/render_plain.fsh', 'utf-8');
const vertexShaderSource = fs.readFileSync(__dirname + '/shader/render.vsh', 'utf-8');

class WebglVideoDriver implements VideoDriverInterface {

    constructor(
        private _canvas: HTMLCanvasElement,
        config: WebglVideoDriver.Config = {}
    ) {
        if (typeof(config.aspect) !== 'undefined') {
            this._aspect = config.aspect;
        }

        if (typeof(config.gamma) !== 'undefined') {
            this._gamma = config.gamma;
        }

        if (typeof(config.povEmulation) !== 'undefined') {
            this._povEmulation = config.povEmulation;
        }

        this._numberOfFramesToCompose = this._povEmulation ? 3 : 1;

        this._textures = new Array<WebGLTexture>(this._numberOfFramesToCompose);
        this._imageData = new Array<PoolMemberInterface<ImageData>>(this._numberOfFramesToCompose);
        this._imageDataGeneration = new Array<number>(this._numberOfFramesToCompose);
        this._textureGeneration = new Array<number>(this._numberOfFramesToCompose);

        this._gl = this._canvas.getContext('webgl', {
            alpha: false
        }) as WebGLRenderingContext;

        for (let i = 0; i < this._numberOfFramesToCompose; i++) {
            this._imageDataGeneration[i] = 0;
            this._textureGeneration[i] = -1;
        }
    }

    init(): this {
        this._createProgram();
        this._createBuffers();
        this.resize();
        this._allocateTextures();
        this._configureTextures();
        this._setupAttribs();

        this.enableInterpolation(true);

        return this;
    }

    resize(width?: number, height?: number): this {
        if (typeof(width) === 'undefined' || typeof(height) === 'undefined') {
            width = this._canvas.clientWidth;
            height = this._canvas.clientHeight;
        }

        this._canvas.width = width;
        this._canvas.height = height;
        this._gl.viewport(0, 0, width, height);
        this._recalculateVertexBuffer();

        if (this._video) {
            this._draw();
        }

        return this;
    }

    getCanvas(): HTMLCanvasElement {
        return this._canvas;
    }

    bind(video: VideoEndpointInterface): this {
        if (this._video) {
            return this;
        }

        this.resize();

        this._video = video;
        this._video.newFrame.addHandler(WebglVideoDriver._frameHandler, this);

        return this;
    }

    unbind(): this {
        this._cancelDraw();

        if (!this._video) {
            return this;
        }

        this._video.newFrame.removeHandler(WebglVideoDriver._frameHandler, this);
        this._video = null;

        return this;
    }

    enableInterpolation(enabled: boolean): this {
        if (enabled === this._interpolation) {
            return this;
        }

        this._interpolation = enabled;
        this._configureTextures();

        return this;
    }

    interpolationEnabled(): boolean {
        return this._interpolation;
    }

    enableSyncRendering(syncRendering: boolean): this {
        if (syncRendering === this._syncRendering) {
            return this;
        }

        if (!syncRendering) {
            this._cancelDraw();
        }

        this._syncRendering = syncRendering;

        return this;
    }

    syncRenderingEnabled(): boolean {
        return this._syncRendering;
    }

    private static _frameHandler(imageDataPoolMember: PoolMemberInterface<ImageData>, self: WebglVideoDriver): void {
        const oldImageData = self._imageData[self._currentFrameIndex];

        self._imageData[self._currentFrameIndex] = imageDataPoolMember;
        self._imageDataGeneration[self._currentFrameIndex]++;
        self._currentFrameIndex = (self._currentFrameIndex + 1) % self._numberOfFramesToCompose;

        if (self._frameCount < self._numberOfFramesToCompose) {
            self._frameCount++;
        } else {
            if (self._syncRendering) {
                self._scheduleDraw();
            } else {
                self._draw();
            }
            oldImageData.release();
        }
    }

    private _scheduleDraw(): void {
        if (this._animationFrameHandle) {
            return;
        }

        this._animationFrameHandle = requestAnimationFrame(
            () => (this._draw(), this._animationFrameHandle = 0)
        );
    }

    private _cancelDraw(): void {
        if (this._animationFrameHandle === 0) {
            return;
        }

        cancelAnimationFrame(this._animationFrameHandle);
        this._animationFrameHandle = 0;
    }

    private _draw(): void {
        if (this._frameCount < this._numberOfFramesToCompose) {
            return;
        }

        const gl = this._gl;

        for (let i = 0; i < this._numberOfFramesToCompose; i++) {
            const frameIndex =
                (this._currentFrameIndex - i - 1 + this._numberOfFramesToCompose) % this._numberOfFramesToCompose;

            if (this._textureGeneration[frameIndex] !== this._imageDataGeneration[frameIndex]) {
                gl.activeTexture((gl as any)[`TEXTURE${frameIndex}`]);
                gl.bindTexture(gl.TEXTURE_2D, this._textures[frameIndex]);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    this._imageData[frameIndex].get()
                );

                this._textureGeneration[frameIndex] = this._imageDataGeneration[frameIndex];
            }
        }

        for (let i = 0; i < this._numberOfFramesToCompose; i++) {
            gl.uniform1i(
                this._getUniformLocation(`u_Sampler${i}`),
                (this._currentFrameIndex + this._numberOfFramesToCompose - i - 1) % this._numberOfFramesToCompose
            );
        }

        gl.uniform1f(this._getUniformLocation('u_Gamma'), this._gamma);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    private _createProgram(): void {
        const gl = this._gl,
            vertexShader = gl.createShader(gl.VERTEX_SHADER),
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER),
            program = gl.createProgram();

        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw new Error(`failed to compile vertex shader: ${gl.getShaderInfoLog(vertexShader)}`);
        }

        gl.shaderSource(
            fragmentShader,
            this._povEmulation ? fragmentShaderPovSource : fragmentSahderPlainSource
        );
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw new Error(`failed to compile fragment shader: ${gl.getShaderInfoLog(fragmentShader)}`);
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`failed to link program: ${gl.getProgramInfoLog(program)}`);
        }

        gl.useProgram(program);

        this._program = program;
    }

    private _allocateTextures(): void {
        for (let i = 0; i < this._numberOfFramesToCompose; i++) {
            this._allocateTexture(i);
        }
    }

    private _configureTextures(): void {
        for (let i = 0; i < this._numberOfFramesToCompose; i++) {
            this._configureTexture(i);
        }
    }

    private _allocateTexture(index: number): void {
        const gl = this._gl,
            texture = gl.createTexture();

        gl.activeTexture((gl as any)[`TEXTURE${index}`]);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        this._textures[index] = texture;
    }

    private _configureTexture(index: number): void {
        const gl = this._gl;

        gl.activeTexture((gl as any)[`TEXTURE${index}`]);
        gl.bindTexture(gl.TEXTURE_2D, this._textures[index]);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this._interpolation ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this._interpolation ? gl.LINEAR : gl.NEAREST);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    }

    private _createBuffers(): void {
        const gl = this._gl,
            vertexBuffer = gl.createBuffer(),
            textureCoordinateBuffer = gl.createBuffer();

        const textureCoordinateData = [1, 1,   0, 1,   1, 0,   0, 0];

        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinateData), gl.STATIC_DRAW);

        this._vertexBuffer = vertexBuffer;
        this._textureCoordinateBuffer = textureCoordinateBuffer;
    }

    private _recalculateVertexBuffer(): void {
        const gl = this._gl,
            targetWidth = this._canvas.width,
            targetHeight = this._canvas.height,
            scaleX = (targetWidth > 0) ?  2 / targetWidth : 1,
            scaleY = (targetHeight > 0 ) ? 2 / targetHeight : 1;

        let width: number,
            height: number,
            west: number,
            north: number;

        if (this._aspect * targetHeight <= targetWidth) {
            height = 2;
            width = this._aspect * targetHeight * scaleX;
            north = 1;
            west = Math.floor(-this._aspect * targetHeight) / 2 * scaleX;
        } else {
            height = targetWidth / this._aspect * scaleY;
            width = 2;
            north = Math.floor(targetWidth / this._aspect) / 2 * scaleY;
            west = -1;
        }

        const vertexData = [
            west + width, north,
            west, north,
            west + width, north - height,
            west, north - height
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    }

    private _getAttribLocation(name: string): number {
        const gl = this._gl,
            location = gl.getAttribLocation(this._program, name);

        if (location < 0) {
            throw new Error(`unable to locate attribute ${name}`);
        }

        return location;
    }

    private _getUniformLocation(name: string): WebGLUniformLocation {
        const gl = this._gl,
            location = gl.getUniformLocation(this._program, name);

        if (location < 0) {
            throw new Error(`unable to locate uniform ${name}`);
        }

        return location;
    }

    private _setupAttribs(): void {
        const gl = this._gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.enableVertexAttribArray(this._getAttribLocation('a_VertexPosition'));
        gl.vertexAttribPointer(
            this._getAttribLocation('a_VertexPosition'),
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.enableVertexAttribArray(this._getAttribLocation('a_TextureCoordinate'));
        gl.vertexAttribPointer(
            this._getAttribLocation('a_TextureCoordinate'),
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
    }

    private _gl: WebGLRenderingContext = null;

    private _program: WebGLProgram = null;
    private _vertexBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;

    private _numberOfFramesToCompose: number;
    private _textures: Array<WebGLTexture>;
    private _imageData: Array<PoolMemberInterface<ImageData>>;
    private _imageDataGeneration: Array<number>;
    private _textureGeneration: Array<number>;
    private _currentFrameIndex = 0;
    private _frameCount = 0;

    private _gamma = 1;
    private _aspect = 4 / 3;
    private _povEmulation = true;

    private _animationFrameHandle = 0;
    private _syncRendering = true;

    private _video: VideoEndpointInterface = null;

    private _interpolation = true;
}

namespace WebglVideoDriver {

    export interface Config {
        povEmulation?: boolean;
        gamma?: number;
        aspect?: number;
    }

}

export default WebglVideoDriver;
