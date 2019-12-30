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

class CartridgeE0 extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x2000) {
            throw new Error(`buffer is not an 8k cartridge image: invalid length ${buffer.length}`);
        }

        for (let i = 0; i < 8; i++) {
            this._banks[i] = new Uint8Array(0x0400);
        }

        for (let i = 0; i < 0x0400; i++) {
            for (let j = 0; j < 8; j++) {
                this._banks[j][i] = buffer[j * 0x0400 + i];
            }
        }

        this.reset();
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signatures shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer, [
            [0x8d, 0xe0, 0x1f], // STA $1FE0
            [0x8d, 0xe0, 0x5f], // STA $5FE0
            [0x8d, 0xe9, 0xff], // STA $FFE9
            [0x0c, 0xe0, 0x1f], // NOP $1FE0
            [0xad, 0xe0, 0x1f], // LDA $1FE0
            [0xad, 0xe9, 0xff], // LDA $FFE9
            [0xad, 0xed, 0xff], // LDA $FFED
            [0xad, 0xf3, 0xbf] // LDA $BFF3
        ]);

        for (let i = 0; i < signatureCounts.length; i++) {
            if (signatureCounts[i] > 0) {
                return true;
            }
        }

        return false;
    }

    reset(): void {
        for (let i = 0; i < 4; i++) {
            this._activeBanks[i] = this._banks[7];
        }
    }

    read(address: number): number {
        address &= 0x0fff;

        if (address >= 0x0fe0 && address < 0x0ff8) {
            this._handleBankswitch(address);
        }

        return this._activeBanks[address >> 10][address & 0x03ff];
    }

    peek(address: number): number {
        address &= 0x0fff;

        return this._activeBanks[address >> 10][address & 0x03ff];
    }

    write(address: number, value: number): void {
        const addressMasked = address & 0x0fff;

        if (addressMasked >= 0x0fe0 && addressMasked < 0x0ff8) {
            this._handleBankswitch(addressMasked);
        }

        return super.write(address, value);
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_E0;
    }

    private _handleBankswitch(address: number): void {
        if (address < 0x0fe8) {
            this._activeBanks[0] = this._banks[address - 0x0fe0];
        } else if (address < 0x0ff0) {
            this._activeBanks[1] = this._banks[address - 0x0fe8];
        } else {
            this._activeBanks[2] = this._banks[address - 0x0ff0];
        }
    }

    private _banks = new Array<Uint8Array>(8);
    private _activeBanks = new Array<Uint8Array>(4);
}

export { CartridgeE0 as default };
