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
        address &= 0x0FFF;

        this._handleBankswitch(address);

        return this._currentBank[address];
    }

    peek(address: number): number {
        return this._currentBank[address & 0x0FFF];
    }

    write(address: number, value: number) {
        address &= 0xFFF;

        this._handleBankswitch(address);

        super.write(address, value);
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_64k_F0;
    }

    private _handleBankswitch(address: number): void {
        if (address === 0x0FF0) {
            this._bankIdx = (this._bankIdx + 1) & 0x0F;
            this._currentBank = this._banks[this._bankIdx];
        }
    }

    private _banks = new Array<Uint8Array>(16);
    private _currentBank: Uint8Array;
    private _bankIdx = 0;
}

export default CartridgeF0;
