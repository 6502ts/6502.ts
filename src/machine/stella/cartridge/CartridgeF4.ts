/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

class CartridgeF4 extends AbstractCartridge {
    constructor(buffer: { [i: number]: number; length: number }, private _supportSC: boolean = true) {
        super();

        if (buffer.length !== 0x8000) {
            throw new Error(`buffer is not a 32k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 8; i++) {
            this._banks[i] = new Uint8Array(0x1000);
        }

        for (let i = 0; i < 0x1000; i++) {
            for (let j = 0; j < 8; j++) {
                this._banks[j][i] = buffer[j * 0x1000 + i];
            }
        }

        this.reset();
    }

    reset(): void {
        this._bank = this._banks[0];
        this._hasSC = false;
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_32k_F4;
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

        if (address >= 0x0ff4 && address <= 0x0ffb) {
            this._bank = this._banks[address - 0x0ff4];
        }
    }

    private _bus: Bus = null;

    private _bank: Uint8Array;
    private _banks = new Array<Uint8Array>(8);
    private _ram = new Uint8Array(0x80);
    private _hasSC = false;
}

export default CartridgeF4;
