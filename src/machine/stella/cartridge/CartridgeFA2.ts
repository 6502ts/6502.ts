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
import Bus from '../Bus';
import * as cartridgeUtil from './util';

const enum IODelay {
    load = 10,
    save = 100
}

class CartridgeFA2 extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x7000 && buffer.length !== 0x7400) {
            throw new Error(`buffer is not a 28k/29k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 7; i++) {
            this._banks[i] = new Uint8Array(0x1000);
        }

        const offset = buffer.length === 0x7000 ? 0 : 0x0400;

        for (let i = 0; i < 0x1000; i++) {
            for (let j = 0; j < 7; j++) {
                this._banks[j][i] = buffer[j * 0x1000 + i + offset];
            }
        }

        this.reset();
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signatures shamelessly stolen from Stella
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer, [
            [0xa0, 0xc1, 0x1f, 0xe0],
            [0x00, 0x80, 0x02, 0xe0]
        ]);

        return signatureCounts[0] > 0 || signatureCounts[1] > 0;
    }

    reset(): void {
        this._accessCounter = 0;
        this._accessCounterLimit = 0;
        this._bank = this._banks[0];
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_FA2;
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < this._ram.length; i++) {
            this._ram[i] = rng.int(0xff);
        }
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    read(address: number): number {
        this.write(address & 0x0fff, this._bus.getLastDataBusValue());

        return this.peek(address);
    }

    peek(address: number): number {
        address &= 0x0fff;

        if (address >= 0x0100 && address < 0x0200) {
            return this._ram[address - 0x0100];
        } else if (address === 0x0ff4) {
            return this._accessCounter >= this._accessCounterLimit
                ? // bit 6 zero: operation complete
                  this._bank[address] & ~0x40
                : // bit 6 one: operation pending
                  this._bank[address] | 0x40;
        } else {
            return this._bank[address];
        }
    }

    write(address: number, value: number): void {
        address &= 0x0fff;

        this._accessCounter++;

        if (address < 0x0100) {
            this._ram[address] = value;
            return;
        }

        if (address === 0x0ff4) {
            return this._handleIo();
        }

        if (address >= 0x0ff5 && address <= 0x0ffb) {
            this._bank = this._banks[address - 0x0ff5];
        }
    }

    private _handleIo(): void {
        if (this._accessCounter < this._accessCounterLimit) {
            return;
        }

        if (this._ram[0xff] === 1) {
            for (let i = 0; i < 0x100; i++) {
                this._ram[i] = this._savedRam[i];
            }

            this._accessCounterLimit = IODelay.load;
        } else if (this._ram[0xff] === 2) {
            for (let i = 0; i < 0x100; i++) {
                this._savedRam[i] = this._ram[i];
            }

            this._accessCounterLimit = IODelay.save;
        } else {
            return;
        }

        this._accessCounter = 0;
        this._ram[0xff] = 0;
    }

    private _bank: Uint8Array;
    private _banks = new Array<Uint8Array>(7);
    private _ram = new Uint8Array(0x100);

    private _savedRam = new Uint8Array(0x100);
    private _accessCounter = 0;
    private _accessCounterLimit = 0;

    private _bus: Bus;
}

export { CartridgeFA2 as default };
