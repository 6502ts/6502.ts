/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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

class Cartridge2k extends AbstractCartridge {
    constructor(buffer: { [i: number]: number; length: number }) {
        super();

        if (buffer.length > 0x0800) {
            throw new Error(`buffer is not a 2k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < buffer.length && i < 0x0800; i++) {
            this._rom[0x07ff - i] = buffer[buffer.length - 1 - i];
        }
    }

    read(address: number): number {
        // Mask out A11 - A15
        return this._rom[address & 0x07ff];
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.vanilla_2k;
    }

    // A11 - A15 masked out -> 0x0800 bytes of ROM
    protected _rom = new Uint8Array(0x0800);
}

export default Cartridge2k;
