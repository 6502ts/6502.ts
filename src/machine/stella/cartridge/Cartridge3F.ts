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
import * as cartridgeUtil from './util';
import CartridgeInfo from './CartridgeInfo';
import Bus from '../Bus';

class Cartridge3F extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x2000) {
            throw new Error(`buffer is not an 8k cartridge image: invalid length ${buffer.length}`);
        }

        for (let i = 0; i < 4; i++) {
            this._banks[i] = new Uint8Array(0x0800);
        }

        this._bank1 = this._banks[3];
        this._bank0 = this._banks[0];

        for (let i = 0; i < 0x0800; i++) {
            for (let j = 0; j < 4; j++) {
                this._banks[j][i] = buffer[0x0800 * j + i];
            }
        }
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signature shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(
            buffer,
            [[0x85, 0x3f]] // STA $3F
        );

        return signatureCounts[0] >= 2;
    }

    reset(): void {
        this._bank0 = this._banks[0];
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        this._bus.event.read.addHandler(Cartridge3F._onBusAccess, this);
        this._bus.event.write.addHandler(Cartridge3F._onBusAccess, this);

        return this;
    }

    read(address: number): number {
        address &= 0x0fff;

        return address < 0x0800 ? this._bank0[address] : this._bank1[address & 0x07ff];
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_3F;
    }

    private static _onBusAccess(accessType: Bus.AccessType, self: Cartridge3F): void {
        if (self._bus.getLastAddresBusValue() === 0x003f) {
            self._bank0 = self._banks[self._bus.getLastDataBusValue() & 0x03];
        }
    }

    private _banks = new Array<Uint8Array>(4);
    private _bank0: Uint8Array;
    private _bank1: Uint8Array;
    private _bus: Bus = null;
}

export { Cartridge3F as default };
