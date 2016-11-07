/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
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

    reset(): void {
        for (let i = 0; i < 4; i++) {
            this._activeBanks[i] = this._banks[7];
        }
    }

    read(address: number): number {
        address &= 0x0FFF;

        if (address >= 0x0FE0 && address < 0x0FF8) {
            this._handleBankswitch(address);
        }

        return this._activeBanks[(address >> 10)][address & 0x03FF];
    }

    peek(address: number): number {
        address &= 0x0FFF;

        return this._activeBanks[(address >> 10)][address & 0x03FF];
    }

    write(address: number, value: number): void {
        const addressMasked = address & 0x0FFF;

        if (addressMasked >= 0x0FE0 && addressMasked < 0x0FF8) {
            this._handleBankswitch(addressMasked);
        }

        return super.write(address, value);
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_E0;
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signatures shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(
            buffer,
            [
                [ 0x8D, 0xE0, 0x1F ],  // STA $1FE0
                [ 0x8D, 0xE0, 0x5F ],  // STA $5FE0
                [ 0x8D, 0xE9, 0xFF ],  // STA $FFE9
                [ 0x0C, 0xE0, 0x1F ],  // NOP $1FE0
                [ 0xAD, 0xE0, 0x1F ],  // LDA $1FE0
                [ 0xAD, 0xE9, 0xFF ],  // LDA $FFE9
                [ 0xAD, 0xED, 0xFF ],  // LDA $FFED
                [ 0xAD, 0xF3, 0xBF ]   // LDA $BFF3
            ]
        );

        for (let i = 0; i < signatureCounts.length; i++) {
            if (signatureCounts[i] > 0) {
                return true;
            }
        }

        return false;
    }

    private _handleBankswitch(address: number): void {
        if (address < 0x0FE8) {
            this._activeBanks[0] = this._banks[address - 0x0FE0];
        }
        else if (address < 0x0FF0) {
            this._activeBanks[1] = this._banks[address - 0x0FE8];
        }
        else {
            this._activeBanks[2] = this._banks[address - 0x0FF0];
        }
    }

    private _banks = new Array<Uint8Array>(8);
    private _activeBanks = new Array<Uint8Array>(4);
}

export default CartridgeE0;
