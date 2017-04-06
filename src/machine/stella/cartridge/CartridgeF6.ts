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
import CartridgeInfo from './CartridgeInfo';
import Bus from '../Bus';

import RngInterface from '../../../tools/rng/GeneratorInterface';

class CartridgeF6 extends AbstractCartridge {

    constructor(
        buffer: {[i: number]: number, length: number},
        private _supportSC: boolean = true

    ) {
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
        this._access(address & 0x0FFF, this._bus.getLastDataBusValue());

        return this.peek(address);
    }

    peek(address: number): number {
        address &= 0x0FFF;

        if (this._hasSC && address >= 0x0080 && address < 0x0100) {
            return this._saraRAM[address - 0x80];
        }

        return this._bank[address];
    }

    write(address: number, value: number): void {
        address &= 0x0FFF;

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
            this._saraRAM[i] = rng.int(0xFF);
        }
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    private _access(address: number, value: number): void {
        if (address < 0x80 && this._hasSC) {
            this._saraRAM[address] = value & 0xFF;
            return;
        }

        switch (address) {
            case 0x0FF6:
                this._bank = this._bank0;
                break;

            case 0x0FF7:
                this._bank = this._bank1;
                break;

            case 0x0FF8:
                this._bank = this._bank2;
                break;

            case 0x0FF9:
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

export default CartridgeF6;
