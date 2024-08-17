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

class CartridgeEF extends AbstractCartridge {
    constructor(buffer: { [i: number]: number; length: number }, private _supportSC: boolean = true) {
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

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        const matchMagic = (magicString: string): boolean => {
            const magic = magicString.split('').map((x) => x.charCodeAt(0));

            for (let i = 0; i < magic.length; i++) {
                if (magic[i] !== buffer[0xfff8 + i]) {
                    return false;
                }
            }

            return true;
        };

        if (buffer.length !== 0x10000) {
            return false;
        }

        if (matchMagic('efef') || matchMagic('efsc')) {
            return true;
        }

        // Signatures shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer, [
            [0x0c, 0xe0, 0xff], // NOP $FFE0
            [0xad, 0xe0, 0xff], // LDA $FFE0
            [0x0c, 0xe0, 0x1f], // NOP $1FE0
            [0xad, 0xe0, 0x1f], // LDA $1FE0
        ]);

        for (let i = 0; i < 4; i++) {
            if (signatureCounts[i] > 0) {
                return true;
            }
        }

        return false;
    }

    reset(): void {
        this._bank = this._banks[15];
        this._hasSC = false;
    }

    getType(): CartridgeType {
        return CartridgeType.bankswitch_64k_EF;
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
        this._access(address & 0x0fff, this._bus.getLastDataBusValue());

        return this.peek(address);
    }

    peek(address: number): number {
        address &= 0x0fff;

        if (this._hasSC && address >= 0x0080 && address < 0x0100) {
            return this._ram[address - 0x80];
        } else {
            return this._bank[address];
        }
    }

    write(address: number, value: number): void {
        address &= 0x0fff;

        if (address < 0x80 && this._supportSC) {
            this._hasSC = true;
        }

        this._access(address, value);
    }

    private _access(address: number, value: number): void {
        if (address < 0x80 && this._hasSC) {
            this._ram[address] = value;
            return;
        }

        if (address >= 0x0fe0 && address <= 0x0fef) {
            this._bank = this._banks[address - 0x0fe0];
        }
    }

    private _bus: Bus = null;

    private _bank: Uint8Array;
    private _banks = new Array<Uint8Array>(16);
    private _ram = new Uint8Array(0x80);
    private _hasSC = false;
}

export { CartridgeEF as default };
