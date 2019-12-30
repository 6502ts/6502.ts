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

const encodingsString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    encodings = new Uint8Array(256);

export namespace __init {
    let i: number;

    for (i = 0; i < 256; i++) {
        encodings[i] = 255;
    }
    for (i = 0; i < 64; i++) {
        encodings[encodingsString.charCodeAt(i)] = i;
    }

    encodings['='.charCodeAt(0)] = 0;
}

function decodeChar(data: string, idx: number): number {
    const value = encodings[data.charCodeAt(idx)];

    if (value > 63) {
        throw new Error('invalid base64 character "' + data[idx] + '" at index ' + idx);
    }

    return value;
}

function decodeNibble(data: string, idx: number): number {
    return (
        (decodeChar(data, idx) << 18) +
        (decodeChar(data, idx + 1) << 12) +
        (decodeChar(data, idx + 2) << 6) +
        decodeChar(data, idx + 3)
    );
}

function getPadding(data: string): number {
    let padding = 0,
        idx = data.length - 1;

    while (idx >= 0 && data[idx--] === '=') {
        padding++;
    }

    return padding;
}

export function decode(data: string): Uint8Array {
    if (data.length % 4 !== 0) {
        throw new Error('invalid base64 data --- char count mismatch');
    }

    const nibbles = data.length / 4,
        decodedSize = nibbles * 3 - getPadding(data),
        decoded = new Uint8Array(decodedSize);

    let idx = 0;

    for (let i = 0; i < nibbles; i++) {
        const nibble = decodeNibble(data, i * 4);

        for (let j = 0; j < 3 && idx < decodedSize; j++) {
            decoded[idx++] = (nibble >>> (8 * (2 - j))) & 0xff;
        }
    }

    return decoded;
}
