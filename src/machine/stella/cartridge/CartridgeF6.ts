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
import Bus from '../Bus';

import RngInterface from '../../../tools/rng/GeneratorInterface';

class CartridgeF6 extends AbstractCartridge {
    constructor(buffer: { [i: number]: number; length: number }, private _supportSC: boolean = true) {
        super();

        if (buffer.length !== 0x4000) {
            throw new Error(`buffer is not a 16k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000; i++) {
            this._bank0[i] = buffer[i];
            this._bank1[i] = buffer[0x1000 + i];
            this._bank2[i] = buffer[0x2000 + i];
            this._bank3[i] = buffer[0x3000 + i];
        }

        this.reset();
    }

    reset(): void {
        this._bank = this._bank0;
        this._hasSC = false;
    }

    read(address: number): number {
        this._access(address & 0x0fff, this._bus.getLastDataBusValue());

        return this.peek(address);
    }

    peek(address: number): number {
        address &= 0x0fff;

        if (this._hasSC && address >= 0x0080 && address < 0x0100) {
            return this._saraRAM[address - 0x80];
        }

        return this._bank[address];
    }

    write(address: number, value: number): void {
        address &= 0x0fff;

        if (address < 0x80 && this._supportSC) {
            this._hasSC = true;
        }

        this._access(address, value);
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_16k_F6;
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < this._saraRAM.length; i++) {
            this._saraRAM[i] = rng.int(0xff);
        }
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    private _access(address: number, value: number): void {
        if (address < 0x80 && this._hasSC) {
            this._saraRAM[address] = value & 0xff;
            return;
        }

        switch (address) {
            case 0x0ff6:
                this._bank = this._bank0;
                break;

            case 0x0ff7:
                this._bank = this._bank1;
                break;

            case 0x0ff8:
                this._bank = this._bank2;
                break;

            case 0x0ff9:
                this._bank = this._bank3;
                break;
        }
    }

    private _bank: Uint8Array = null;
    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);
    private _bank2 = new Uint8Array(0x1000);
    private _bank3 = new Uint8Array(0x1000);

    private _hasSC = false;
    private _saraRAM = new Uint8Array(0x80);

    private _bus: Bus = null;
}

export { CartridgeF6 as default };
