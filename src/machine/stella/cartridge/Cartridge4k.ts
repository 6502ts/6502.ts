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

class Cartridge4k extends AbstractCartridge {

    constructor (buffer: {[i: number]: number; length: number}) {
        super();

        if (buffer.length !== 0x1000) {
            throw new Error(`buffer is not an 4k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000 && i < buffer.length; i++)
            this._rom[0x0FFF - i] = buffer[buffer.length -1 - i];
    }

    read(address: number): number {
        // Mask out A12 - A15
        return this._rom[address & 0x0FFF];
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.vanilla_4k;
    }

    // A12 - A15 masked out -> 0x1000 bytes of ROM
    protected _rom = new Uint8Array(0x1000);
}

export default Cartridge4k;
