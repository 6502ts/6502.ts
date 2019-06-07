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
