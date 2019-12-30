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

function encodeWithPrefix(value: number, width?: number, signed = true, prefix = ''): string {
    if (!signed && value < 0) {
        return (
            encodeWithPrefix(value >>> 16, width && width > 8 ? width - 4 : 4, false, prefix) +
            encodeWithPrefix(value & 0xffff, 4)
        );
    }

    let result = Math.abs(value)
        .toString(16)
        .toUpperCase();

    if (typeof width !== 'undefined') {
        while (result.length < width) {
            result = '0' + result;
        }
    }

    return (value < 0 ? '-' : '') + prefix + result;
}

export function encode(value: number, width?: number, signed = true): string {
    return encodeWithPrefix(value, width, signed, '$');
}

export function decode(value: string): number {
    const sign = value.match(/^-/) ? -1 : 1;

    let stripped = value.replace(/^-/, '').toUpperCase();

    if (stripped.match(/^0X[0-9A-F]+$/)) {
        stripped = stripped.replace(/^0x/, '');
    } else if (stripped.match(/^\$[0-9A-F]+$/)) {
        stripped = stripped.replace(/^\$/, '');
    } else {
        throw new TypeError('invalid hex number ' + value);
    }

    return sign * parseInt(stripped, 16);
}
