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

import RGBASurfaceInterface from './RGBASurfaceInterface';

class ArrayBufferSurface implements RGBASurfaceInterface {

    static createFromArrayBuffer(width: number, height: number, buffer: ArrayBuffer): ArrayBufferSurface {
        return (new ArrayBufferSurface()).replaceUnderlyingBuffer(width, height, buffer);
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

export default ArrayBufferSurface;
