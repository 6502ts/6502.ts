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


import * as fs from 'fs';

import PoolMemberInterface from '../../../tools/pool/PoolMemberInterface';
import VideoEndpointInterface from '../VideoEndpointInterface';

const fragmentShaderSource = fs.readFileSync(__dirname + '/shader/render.fsh', 'utf-8');
const vertexShaderSource = fs.readFileSync(__dirname + '/shader/render.vsh', 'utf-8');

const FRAME_COMPOSITING_COUNT = 3;

export default class WebglVideoDriver {

    constructor(
        private _canvas: HTMLCanvasElement,
        private _gamma = 1
    ) {
        this._gl = this._canvas.getContext('webgl', {
            alpha: false
        }) as WebGLRenderingContext;
    }

    init(): void {
        this._createProgram();
        this._createBuffers();
        this._allocateTextures();
        this._setupAttribs();
    }

    bind(video: VideoEndpointInterface): void {
        if (this._video) {
            return;
        }

        this._video = video;

        this._canvas.width = this._video.getWidth();
        this._canvas.height = this._video.getHeight();
        this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);

        this._video.newFrame.addHandler(WebglVideoDriver._frameHandler, this);
    }

    unbind(): void {
        if (!this._video) {
            return;
        }

        this._video.newFrame.removeHandler(WebglVideoDriver._frameHandler, this);
        this._video = null;
    }

    private static _frameHandler(imageDataPoolMember: PoolMemberInterface<ImageData>, self: WebglVideoDriver): void {
        const gl = self._gl,
            oldImageData = self._imageData[self._currentFrameIndex];

        self._imageData[self._currentFrameIndex] = imageDataPoolMember;

        gl.activeTexture((gl as any)[`TEXTURE${self._currentFrameIndex}`]);
        gl.bindTexture(gl.TEXTURE_2D, self._textures[self._currentFrameIndex]);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            imageDataPoolMember.get()
        );

        if (self._frameCount < FRAME_COMPOSITING_COUNT) {
            self._currentFrameIndex = (self._currentFrameIndex + 1) % FRAME_COMPOSITING_COUNT;
            self._frameCount++;
            return;
        }

        for (let i = 0; i < FRAME_COMPOSITING_COUNT; i++) {
            gl.uniform1i(
                self._getUniformLocation(`u_Sampler${i}`),
                (self._currentFrameIndex + FRAME_COMPOSITING_COUNT - i) % FRAME_COMPOSITING_COUNT
            );
        }

        gl.uniform1f(self._getUniformLocation('u_Gamma'), self._gamma);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        self._currentFrameIndex = (self._currentFrameIndex + 1) % FRAME_COMPOSITING_COUNT;

        oldImageData.release();
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

        gl.shaderSource(fragmentShader, fragmentShaderSource);
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
        for (let i = 0; i < FRAME_COMPOSITING_COUNT; i++) {
            this._allocateTexture(i);
        }
    }

    private _allocateTexture(index: number): void {
        const gl = this._gl,
            texture = gl.createTexture();

        gl.activeTexture((gl as any)[`TEXTURE${index}`]);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

        this._textures[index] = texture;
    }

    private _createBuffers(): void {
        const gl = this._gl,
            vertexBuffer = gl.createBuffer(),
            textureCoordinateBuffer = gl.createBuffer();

        const vertexData = [1, 1,   -1, 1,   1, -1,   -1, -1],
            textureCoordinateData = [1, 1,   0, 1,   1, 0,   0, 0];

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinateData), gl.STATIC_DRAW);

        this._vertexBuffer = vertexBuffer;
        this._textureCoordinateBuffer = textureCoordinateBuffer;
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

    private _textures = new Array<WebGLTexture>(FRAME_COMPOSITING_COUNT);
    private _imageData = new Array<PoolMemberInterface<ImageData>>(FRAME_COMPOSITING_COUNT);
    private _currentFrameIndex = 0;
    private _frameCount = 0;

    private _video: VideoEndpointInterface = null;

}
