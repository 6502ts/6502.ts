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

import BusInterface from '../bus/BusInterface';

class Memory implements BusInterface {
    constructor() {
        this.clear();
    }

    reset(): void {}

    clear(): void {
        for (let i = 0; i < 0x10000; i++) {
            this._data[i] = 0;
        }
    }

    read(address: number): number {
        return this._data[address];
    }

    peek(address: number): number {
        return this._data[address];
    }

    readWord(address: number): number {
        return this._data[address] + (this._data[(address + 1) & 0xffff] << 8);
    }

    write(address: number, value: number) {
        this._data[address] = value;
    }

    poke(address: number, value: number) {
        this._data[address] = value;
    }

    protected _data = new Uint8Array(0x10000);
}

export { Memory as default };
