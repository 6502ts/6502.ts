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

const decodes0 = new Uint8Array(160),
    decodes1 = new Uint8Array(160),
    decodes2 = new Uint8Array(160),
    decodes3 = new Uint8Array(160),
    decodes4 = new Uint8Array(160),
    decodes6 = new Uint8Array(160);

export const decodesMissile: Array<Uint8Array> = [
    decodes0,
    decodes1,
    decodes2,
    decodes3,
    decodes4,
    decodes0,
    decodes6,
    decodes0
];

export const decodesPlayer: Array<Uint8Array> = [
    decodes0,
    decodes1,
    decodes2,
    decodes3,
    decodes4,
    decodes0,
    decodes6,
    decodes0
];

[decodes0, decodes1, decodes2, decodes3, decodes4, decodes6].forEach(decodes => {
    for (let i = 0; i < 160; i++) {
        decodes[i] = 0;
    }

    decodes[156] = 1;
});

decodes1[12] = 1;
decodes2[28] = 1;
decodes3[12] = decodes3[28] = 1;
decodes4[60] = 1;
decodes6[28] = decodes6[60] = 1;
