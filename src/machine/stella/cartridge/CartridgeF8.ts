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
import Bus from '../Bus';
import * as cartridgeUtil from './util';

import RngInterface from '../../../tools/rng/GeneratorInterface';
import { CartridgeType } from './CartridgeInfo';

class CartridgeF8 extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface, private _supportSC = true) {
        super();

        if (buffer.length !== 0x2000) {
            throw new Error(`buffer is not an 8k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000; i++) {
            this._bank0[i] = buffer[i];
            this._bank1[i] = buffer[0x1000 + i];
        }

        this.reset();
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signatures shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(
            buffer,
            [[0x8d, 0xf9, 0x1f]] // STA $1FF9
        );

        return signatureCounts[0] >= 2;
    }

    reset(): void {
        this._bank = this._bank1;
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

    getType(): CartridgeType {
        return CartridgeType.bankswitch_8k_F8;
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
            case 0x0ff8:
                this._bank = this._bank0;
                break;

            case 0x0ff9:
                this._bank = this._bank1;
                break;
        }
    }

    private _bank: Uint8Array = null;
    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);

    private _hasSC = false;
    private _saraRAM = new Uint8Array(0x80);

    private _bus: Bus = null;
}

export { CartridgeF8 as default };
