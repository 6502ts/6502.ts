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

export const vertexShader = `
    attribute vec2 a_VertexPosition;
    attribute vec2 a_TextureCoordinate;

    varying vec2 v_TextureCoordinate;

    void main() {
        v_TextureCoordinate = a_TextureCoordinate;
        gl_Position = vec4(a_VertexPosition, 0, 1);
    }
`;

export const fragmentShaderPlain = `
    precision mediump float;

    varying vec2 v_TextureCoordinate;

    uniform sampler2D u_Sampler0;
    uniform float u_Gamma;

    void main() {
        vec4 texel = texture2D(u_Sampler0, v_TextureCoordinate);

        gl_FragColor = vec4(pow(texel.rgb, vec3(u_Gamma)), 1.);
    }
`;

export const fragmentShaderPov = `
    precision mediump float;

    varying vec2 v_TextureCoordinate;

    uniform sampler2D u_Sampler0, u_Sampler1, u_Sampler2;
    uniform float u_Gamma;

    void main() {
        vec4 compositedTexel =
            0.4 * texture2D(u_Sampler0, v_TextureCoordinate) +
            0.4 * texture2D(u_Sampler1, v_TextureCoordinate) +
            0.2 * texture2D(u_Sampler2, v_TextureCoordinate);

        gl_FragColor = vec4(pow(compositedTexel.rgb, vec3(u_Gamma)), 1.);
    }
`;
