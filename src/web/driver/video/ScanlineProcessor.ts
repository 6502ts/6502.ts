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

import Processor from './Processor';
import Program from './Program';
import { fsh, vsh } from './shader';
import { Capabilities } from './Capabilities';

class ScanlineProcessor implements Processor {
    constructor(private _gl: WebGLRenderingContext, private _capabilities: Capabilities) {}

    init(): void {
        if (this._initialized) return;

        const gl = this._gl;

        this._framebuffer = gl.createFramebuffer();
        this._program = Program.compile(
            gl,
            vsh.plain.source(this._capabilities),
            fsh.scanlines.source(this._capabilities)
        );

        this._program.use();
        this._program.uniform1i(fsh.scanlines.uniform.textureUnit, 0);

        this._vertexCoordinateBuffer = gl.createBuffer();
        this._textureCoordinateBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);

        this._initialized = true;
    }

    destroy(): void {
        if (!this._initialized) return;

        const gl = this._gl;

        this._program.delete();
        gl.deleteFramebuffer(this._framebuffer);
        gl.deleteBuffer(this._vertexCoordinateBuffer);
        gl.deleteBuffer(this._textureCoordinateBuffer);

        if (this._texture) gl.deleteTexture(this._texture);

        this._initialized = false;
    }

    render(texture: WebGLTexture): void {
        const gl = this._gl;

        this._program.use();

        this._program.bindVertexAttribArray(
            vsh.plain.attribute.vertexPosition,
            this._vertexCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        this._program.bindVertexAttribArray(
            vsh.plain.attribute.textureCoordinate,
            this._textureCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0);

        gl.viewport(0, 0, this._width, 2 * this._height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    getWidth(): number {
        return this._width;
    }

    getHeight(): number {
        return 2 * this._height;
    }

    getTexture(): WebGLTexture {
        return this._texture;
    }

    resize(width: number, height: number): void {
        if (!this._initialized) return;

        this._width = width;
        this._height = height;

        const gl = this._gl;

        if (this._texture) gl.deleteTexture(this._texture);
        this._texture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0);

        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, 2 * height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        this._program.use();
        this._program.uniform1f(fsh.scanlines.uniform.height, 2 * this._height);
    }

    configure(level: number): void {
        if (!this._initialized) return;

        this._program.use();
        this._program.uniform1f(fsh.scanlines.uniform.level, 1 - level);
    }

    private _width = 0;
    private _height = 0;

    private _texture: WebGLTexture = null;
    private _program: Program = null;
    private _framebuffer: WebGLFramebuffer = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;

    private _initialized = false;
}

export default ScanlineProcessor;
