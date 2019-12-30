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

class Header {
    constructor(buffer: { [idx: number]: number; length: number }) {
        this.startAddressLow = buffer[0x2000];
        this.startAddressHigh = buffer[0x2001];
        this.controlWord = buffer[0x2002];
        this.blockCount = buffer[0x2003];
        this.checksum = buffer[0x2004];
        this.multiloadId = buffer[0x2005];
        this.progressBarSpeedLow = buffer[0x2006];
        this.progressBarSpeedHigh = buffer[0x2007];

        this.blockLocation = new Uint8Array(this.blockCount);
        this.blockChecksum = new Uint8Array(this.blockCount);

        for (let i = 0; i < this.blockCount; i++) {
            this.blockLocation[i] = buffer[0x2000 + 16 + i];
            this.blockChecksum[i] = buffer[0x2000 + 64 + i];
        }
    }

    verify(): boolean {
        const checksum =
            this.startAddressLow +
            this.startAddressHigh +
            this.controlWord +
            this.blockCount +
            this.checksum +
            this.multiloadId +
            this.progressBarSpeedLow +
            this.progressBarSpeedHigh;

        return (checksum & 0xff) === 0x55;
    }

    startAddressLow: number;
    startAddressHigh: number;
    controlWord: number;
    blockCount: number;
    checksum: number;
    multiloadId: number;
    progressBarSpeedLow: number;
    progressBarSpeedHigh: number;

    blockLocation: Uint8Array = null;
    blockChecksum: Uint8Array = null;
}

export { Header as default };
