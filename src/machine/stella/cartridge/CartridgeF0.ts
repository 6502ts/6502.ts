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
import * as cartridgeUtil from './util';
import CartridgeInfo from './CartridgeInfo';

class CartridgeF0 extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x10000) {
            throw new Error(`buffer is not a 64k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 16; i++) {
            this._banks[i] = new Uint8Array(0x1000);
        }

        for (let i = 0; i < 0x1000; i++) {
            for (let j = 0; j < 16; j++) {
                this._banks[j][i] = buffer[j * 0x1000 + i];
            }
        }

        this.reset();
    }

    reset(): void {
        this._bankIdx = 0;
        this._currentBank = this._banks[this._bankIdx];
    }

    read(address: number): number {
        address &= 0x0fff;

        this._handleBankswitch(address);

        return this._currentBank[address];
    }

    peek(address: number): number {
        return this._currentBank[address & 0x0fff];
    }

    write(address: number, value: number) {
        address &= 0xfff;

        this._handleBankswitch(address);

        super.write(address, value);
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_64k_F0;
    }

    private _handleBankswitch(address: number): void {
        if (address === 0x0ff0) {
            this._bankIdx = (this._bankIdx + 1) & 0x0f;
            this._currentBank = this._banks[this._bankIdx];
        }
    }

    private _banks = new Array<Uint8Array>(16);
    private _currentBank: Uint8Array;
    private _bankIdx = 0;
}

export { CartridgeF0 as default };
