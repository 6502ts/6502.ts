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
import CartridgeInfo from './CartridgeInfo';
import RngInterface from '../../../tools/rng/GeneratorInterface';
import * as cartridgeUtil from './util';

class CartridgeFA extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x3000) {
            throw new Error(`buffer is not a 12k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000; i++) {
            this._bank0[i] = buffer[i];
            this._bank1[i] = buffer[0x1000 + i];
            this._bank2[i] = buffer[0x2000 + i];
        }

        this.reset();
    }

    reset(): void {
        this._bank = this._bank0;
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < this._ram.length; i++) {
            this._ram[i] = rng.int(0xff);
        }
    }

    read(address: number): number {
        this._handleBankswitch(address & 0x0fff);

        return this.peek(address);
    }

    peek(address: number): number {
        address &= 0x0fff;

        if (address >= 0x0100 && address < 0x0200) {
            return this._ram[address & 0xff];
        } else {
            return this._bank[address];
        }
    }

    write(address: number, value: number): void {
        address &= 0x0fff;

        this._handleBankswitch(address);

        if (address < 0x0100) {
            this._ram[address] = value & 0xff;
        } else {
            super.write(address, value);
        }
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_12k_FA;
    }

    private _handleBankswitch(address: number): void {
        switch (address) {
            case 0x0ff8:
                this._bank = this._bank0;
                break;

            case 0x0ff9:
                this._bank = this._bank1;
                break;

            case 0x0ffa:
                this._bank = this._bank2;
                break;
        }
    }

    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);
    private _bank2 = new Uint8Array(0x1000);

    private _bank: Uint8Array;

    private _ram = new Uint8Array(0x0100);
}

export { CartridgeFA as default };
