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
        throw new Error(
            'invalid base64 character "' + data[idx] + '" at index ' + idx
        );
    }

    return value;
}

function decodeNibble(data: string, idx: number): number {
    return  (decodeChar(data, idx)   << 18) +
            (decodeChar(data, idx + 1) << 12) +
            (decodeChar(data, idx + 2) << 6) +
             decodeChar(data, idx + 3);
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
        throw new Error(
            'invalid base64 data --- char count mismatch'
        );
    }

    const nibbles = data.length / 4,
        decodedSize = nibbles * 3 - getPadding(data),
        decoded = new Uint8Array(decodedSize);

    let idx = 0;

    for (let i = 0; i < nibbles; i++) {
        const nibble = decodeNibble(data, i * 4);

        for (let j = 0; j < 3 && idx < decodedSize; j++) {
            decoded[idx++] = (nibble >>> (8 * (2 - j))) & 0xFF;
        }
    }

    return decoded;
}
