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
import * as cartridgeUtil from './util';

import RngInterface from '../../../tools/rng/GeneratorInterface';

class CartridgeF8 extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface, private _supportSC = true) {
        super();

        if (buffer.length !== 0x2000) {
            throw new Error(`buffer is not an 8k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 0x1000; i++) {
            this._bank0[i] = buffer[i];
            this._bank1[i] = buffer[0x1000 + i];
        }

        this.reset();
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signatures shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(
            buffer,
            [[0x8d, 0xf9, 0x1f]] // STA $1FF9
        );

        return signatureCounts[0] >= 2;
    }

    reset(): void {
        this._bank = this._bank1;
        this._hasSC = false;
    }

    read(address: number): number {
        this._access(address & 0x0fff, this._bus.getLastDataBusValue());

        return this.peek(address);
    }

    peek(address: number): number {
        address &= 0x0fff;

        if (this._hasSC && address >= 0x0080 && address < 0x0100) {
            return this._saraRAM[address - 0x80];
        }

        return this._bank[address];
    }

    write(address: number, value: number): void {
        address &= 0x0fff;

        if (address < 0x80 && this._supportSC) {
            this._hasSC = true;
        }

        this._access(address, value);
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_F8;
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < this._saraRAM.length; i++) {
            this._saraRAM[i] = rng.int(0xff);
        }
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    private _access(address: number, value: number): void {
        if (address < 0x80 && this._hasSC) {
            this._saraRAM[address] = value & 0xff;
            return;
        }

        switch (address) {
            case 0x0ff8:
                this._bank = this._bank0;
                break;

            case 0x0ff9:
                this._bank = this._bank1;
                break;
        }
    }

    private _bank: Uint8Array = null;
    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);

    private _hasSC = false;
    private _saraRAM = new Uint8Array(0x80);

    private _bus: Bus = null;
}

export { CartridgeF8 as default };
