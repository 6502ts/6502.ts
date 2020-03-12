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

function compileShader(gl: WebGLRenderingContext, type: GLenum, source: string): WebGLShader {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`failed to compile shader:\n\n${gl.getShaderInfoLog(shader)}\n\n${source}`);
    }

    return shader;
}

class Program {
    private constructor(
        private _gl: WebGLRenderingContext,
        private _program: WebGLProgram,
        private _vsh: WebGLShader,
        private _fsh: WebGLShader
    ) {}

    static compile(
        gl: WebGLRenderingContext,
        vshSource: string,
        fshSource: string,
        layout: Record<string, number> = { a_VertexPosition: 0 }
    ): Program {
        const vsh = compileShader(gl, gl.VERTEX_SHADER, vshSource);
        const fsh = compileShader(gl, gl.FRAGMENT_SHADER, fshSource);
        const program = gl.createProgram();

        for (const attrib of Object.keys(layout)) {
            gl.bindAttribLocation(program, layout[attrib], attrib);
        }

        gl.attachShader(program, vsh);
        gl.attachShader(program, fsh);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`failed to link program:\n\n${gl.getProgramInfoLog(program)}`);
        }

        return new Program(gl, program, vsh, fsh);
    }

    delete(): void {
        const gl = this._gl;

        gl.deleteProgram(this._program);
        gl.deleteShader(this._vsh);
        gl.deleteShader(this._fsh);
    }

    use(): void {
        this._gl.useProgram(this._program);
    }

    getAttribLocation(name: string): number {
        if (!this._attributeLocations.has(name)) {
            const location = this._gl.getAttribLocation(this._program, name);

            if (location < 0) {
                throw new Error(`invalid attribute ${name}`);
            }

            this._attributeLocations.set(name, location);
        }

        return this._attributeLocations.get(name);
    }

    getUniformLocation(name: string): WebGLUniformLocation {
        if (!this._uniformLocations.has(name)) {
            const location = this._gl.getUniformLocation(this._program, name);

            if (location === null) {
                throw new Error(`invalid uniform ${name}`);
            }

            this._uniformLocations.set(name, location);
        }

        return this._uniformLocations.get(name);
    }

    bindVertexAttribArray(
        attribute: string,
        buffer: WebGLBuffer,
        size: number,
        type: number,
        normalized: boolean,
        stride: number,
        offset: number
    ): void {
        const gl = this._gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(this.getAttribLocation(attribute), size, type, normalized, stride, offset);
        gl.enableVertexAttribArray(this.getAttribLocation(attribute));
    }

    uniform1i(uniform: string, value: number) {
        this._gl.uniform1i(this.getUniformLocation(uniform), value);
    }

    uniform1f(uniform: string, value: number) {
        this._gl.uniform1f(this.getUniformLocation(uniform), value);
    }

    private _attributeLocations = new Map<string, number>();
    private _uniformLocations = new Map<string, WebGLUniformLocation>();
}

export default Program;
