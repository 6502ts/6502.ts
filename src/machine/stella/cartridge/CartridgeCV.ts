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
import RngGeneratorInterface from '../../../tools/rng/GeneratorInterface';
import Bus from '../Bus';
import { BufferInterface, searchForSignatures } from './util';

class CartridgeCV extends AbstractCartridge {
    constructor(buffer: { [i: number]: number; length: number }) {
        super();

        if (buffer.length !== 0x0800) {
            throw new Error(`buffer is not a 2k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x0800; i++) {
            this._rom[i] = buffer[i];
        }
    }

    static matchesBuffer(buffer: BufferInterface): boolean {
        // Signatures shamelessly stolen from Stella
        const signatureCounts = searchForSignatures(buffer, [[0x9d, 0xff, 0xf3], [0x99, 0x00, 0xf4]]);

        return signatureCounts[0] > 0 || signatureCounts[1] > 0;
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    randomize(rng: RngGeneratorInterface): void {
        for (let i = 0; i < 0x0400; i++) {
            this._ram[i] = rng.int(0xff);
        }
    }

    read(address: number): number {
        address &= 0x0fff;

        if (address < 0x0400) {
            return this._ram[address];
        }

        if (address < 0x0800) {
            return (this._ram[address & 0x03ff] = this._bus.getLastDataBusValue());
        }

        return this._rom[address & 0x07ff];
    }

    write(address: number, value: number): void {
        address &= 0x0fff;

        if (address >= 0x0400 && address < 0x0800) {
            this._ram[address & 0x03ff] = value;
        }
    }

    peek(address: number): number {
        address &= 0x0fff;

        if (address < 0x0400) {
            return this._ram[address];
        }

        if (address < 0x0800) {
            return 0;
        }

        return this._rom[address & 0x07ff];
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_2k_cv;
    }

    private _rom = new Uint8Array(0x0800);
    private _ram = new Uint8Array(0x0400);

    private _bus: Bus;
}

export default CartridgeCV;
