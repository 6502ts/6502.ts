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

import BusInterface from '../../../../src/machine/bus/BusInterface';
import AccessLog from './AccessLog';

class InstrumentedBus implements BusInterface {
    readWord(address: number): number {
        return this.read(address) | (this.read((address + 1) & 0xffff) << 8);
    }

    read(address: number): number {
        this._accessLog.read(address);

        return this._memory[address];
    }

    write(address: number, value: number): void {
        this._accessLog.write(address);

        this._memory[address] = value;
    }

    peek(address: number): number {
        return this.read(address);
    }

    poke(address: number, value: number): void {
        return this.write(address, value);
    }

    getLog(): AccessLog {
        return this._accessLog;
    }

    private _accessLog = new AccessLog();
    private _memory = new Uint8Array(0x10000);
}

export { InstrumentedBus as default };
