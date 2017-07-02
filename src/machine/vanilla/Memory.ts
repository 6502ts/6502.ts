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

import BusInterface from '../bus/BusInterface';

class Memory implements BusInterface {

    constructor() {
        this.clear();
    }

    reset(): void {}

    clear(): void {
        for (let i = 0; i < 0x10000; i++) {
            this._data[i] = 0;
        }
    }

    read(address: number): number {
        return this._data[address];
    }

    peek(address: number): number {
        return this._data[address];
    }

    readWord(address: number): number {
        return this._data[address] + (this._data[(address + 1) & 0xFFFF] << 8);
    }

    write(address: number, value: number) {
        this._data[address] = value;
    }

    poke(address: number, value: number) {
        this._data[address] = value;
    }

    protected _data = new Uint8Array(0x10000);
}

export default Memory;
