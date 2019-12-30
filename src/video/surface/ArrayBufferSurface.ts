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

import RGBASurfaceInterface from './RGBASurfaceInterface';

class ArrayBufferSurface implements RGBASurfaceInterface {
    static createFromArrayBuffer(width: number, height: number, buffer: ArrayBuffer): ArrayBufferSurface {
        return new ArrayBufferSurface().replaceUnderlyingBuffer(width, height, buffer);
    }

    replaceUnderlyingBuffer(width: number, height: number, buffer: ArrayBuffer): ArrayBufferSurface {
        if (width * height * 4 !== buffer.byteLength) {
            throw new Error('surface size mismatch');
        }

        this._width = width;
        this._height = height;
        this._underlyingBuffer = buffer;

        this._buffer = new Uint32Array(this._underlyingBuffer);

        return this;
    }

    getUnderlyingBuffer(): ArrayBuffer {
        return this._underlyingBuffer;
    }

    resetUnderlyingBuffer(): ArrayBufferSurface {
        this._width = this._height = 0;
        this._underlyingBuffer = this._buffer = null;

        return this;
    }

    getWidth(): number {
        return this._width;
    }

    getHeight(): number {
        return this._height;
    }

    getBuffer(): Uint32Array {
        return this._buffer;
    }

    getByteOrder(): RGBASurfaceInterface.ByteOrder {
        return RGBASurfaceInterface.ByteOrder.rgba;
    }

    fill(value: number): this {
        for (let i = 0; i < this._buffer.length; i++) {
            this._buffer[i] = value;
        }

        return this;
    }

    private _height = 0;
    private _width = 0;
    private _underlyingBuffer: ArrayBuffer;

    private _buffer: Uint32Array = null;
}

export { ArrayBufferSurface as default };
