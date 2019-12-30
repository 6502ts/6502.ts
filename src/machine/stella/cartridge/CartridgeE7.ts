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

import RngInterface from '../../../tools/rng/GeneratorInterface';

class CartrdigeE7 extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x4000) {
            throw new Error(`buffer is not a 16k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 8; i++) {
            this._banks[i] = new Uint8Array(0x0800);
        }

        for (let i = 0; i < 4; i++) {
            this._ram1Banks[i] = new Uint8Array(0x100);
        }

        for (let i = 0; i < 0x0800; i++) {
            for (let j = 0; j < 8; j++) {
                this._banks[j][i] = buffer[j * 0x0800 + i];
            }
        }

        this.reset();
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signatures shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer, [
            [0xad, 0xe2, 0xff], // LDA $FFE2
            [0xad, 0xe5, 0xff], // LDA $FFE5
            [0xad, 0xe5, 0x1f], // LDA $1FE5
            [0xad, 0xe7, 0x1f], // LDA $1FE7
            [0x0c, 0xe7, 0x1f], // NOP $1FE7
            [0x8d, 0xe7, 0xff], // STA $FFE7
            [0x8d, 0xe7, 0x1f] // STA $1FE7
        ]);

        for (let i = 0; i < signatureCounts.length; i++) {
            if (signatureCounts[i] > 0) {
                return true;
            }
        }

        return false;
    }

    reset(): void {
        this._bank0 = this._banks[0];
        this._ram1 = this._ram1Banks[0];
        this._ram0Enabled = false;
    }

    read(address: number): number {
        this._handleBankswitch(address & 0x0fff);

        return this.peek(address);
    }

    peek(address: number): number {
        address &= 0x0fff;

        // 0 -> 0x07FF: bank 0 - 6 or RAM
        if (address < 0x0800) {
            // RAM enabled?
            if (this._ram0Enabled) {
                // 0x0000 - 0x03FF is write, 0x0400 - 0x07FF is read
                return address >= 0x0400 ? this._ram0[address - 0x0400] : 0;
            } else {
                //  bank 0 - 6
                return this._bank0[address];
            }
        }

        // 0x0800 -> 0x9FF is RAM
        if (address <= 0x09ff) {
            // 0x0800 - 0x08FF is write, 0x0900 - 0x09FF is read
            return address >= 0x0900 ? this._ram1[address - 0x0900] : 0;
        }

        // Higher address are the remaining 1.5k of bank 7
        return this._banks[7][0x07ff - (0x0fff - address)];
    }

    write(address: number, value: number) {
        address &= 0x0fff;

        this._handleBankswitch(address);

        if (address < 0x0400) {
            if (this._ram0Enabled) {
                this._ram0[address] = value;
            } else {
                super.write(address, value);
            }
        } else if (address < 0x0800) {
            super.write(address, value);
        } else if (address < 0x08ff) {
            this._ram1[address - 0x0800] = value;
        } else {
            super.write(address, value);
        }
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_16k_E7;
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < this._ram1Banks[i].length; j++) {
                this._ram1Banks[i][j] = rng.int(0xff);
            }
        }

        for (let i = 0; i < this._ram0.length; i++) {
            this._ram0[i] = rng.int(0xff);
        }
    }

    private _handleBankswitch(address: number): void {
        if (address < 0x0fe0) {
            return;
        }

        if (address <= 0x0fe6) {
            this._bank0 = this._banks[address & 0x000f];
            this._ram0Enabled = false;
        } else if (address === 0x0fe7) {
            this._ram0Enabled = true;
        } else if (address <= 0x0feb) {
            this._ram1 = this._ram1Banks[address - 0x0fe8];
        }
    }

    private _banks = new Array<Uint8Array>(8);
    private _bank0: Uint8Array;

    private _ram0 = new Uint8Array(0x0400);
    private _ram1Banks = new Array<Uint8Array>(4);
    private _ram1: Uint8Array;
    private _ram0Enabled = false;
}

export { CartrdigeE7 as default };
