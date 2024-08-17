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

import AbstractCartridge from './AbstractCartridge';
import { CartridgeType } from './CartridgeInfo';

function nextPowerOfTwo(x: number): number {
    let v = 1;

    while (v < x) {
        v *= 2;
    }

    return v;
}

function padBuffer(buffer: ArrayLike<number>): ArrayLike<number> {
    const paddedLength = nextPowerOfTwo(buffer.length);

    if (paddedLength === buffer.length) {
        return buffer;
    }

    const paddedBuffer = new Uint8Array(paddedLength);

    for (let i = 0; i < paddedLength; i++) {
        paddedBuffer[paddedLength - i - 1] = i < buffer.length ? buffer[buffer.length - i - 1] : 0;
    }

    return paddedBuffer;
}

class Cartridge2k extends AbstractCartridge {
    constructor(buffer: { [i: number]: number; length: number }) {
        super();

        if (buffer.length > 0x0800) {
            throw new Error(`buffer is not a 2k cartridge image: wrong length ${buffer.length}`);
        }

        const paddedBuffer = padBuffer(buffer);

        for (let i = 0; i < 0x0800; i++) {
            this._rom[i] = buffer[i % paddedBuffer.length];
        }
    }

    read(address: number): number {
        // Mask out A11 - A15
        return this._rom[address & 0x07ff];
    }

    getType(): CartridgeType {
        return CartridgeType.vanilla_2k;
    }

    // A11 - A15 masked out -> 0x0800 bytes of ROM
    protected _rom = new Uint8Array(0x0800);
}

export { Cartridge2k as default };
