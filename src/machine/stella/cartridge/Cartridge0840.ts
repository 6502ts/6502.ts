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

class Cartridge8040 extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
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
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer, [
            [0xad, 0x00, 0x08], // LDA $0800
            [0xad, 0x40, 0x08], // LDA $0840
            [0x2c, 0x00, 0x08], // BIT $0800
            [0x0c, 0x00, 0x08, 0x4c], // NOP $0800; JMP ...
            [0x0c, 0xff, 0x0f, 0x4c] // NOP $0FFF; JMP ...
        ]);

        for (const count of signatureCounts) {
            if (count >= 2) {
                return true;
            }
        }

        return false;
    }

    reset(): void {
        this._bank = this._bank0;
    }

    read(address: number): number {
        return this.peek(address);
    }

    peek(address: number): number {
        address &= 0x0fff;

        return this._bank[address];
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_econobanking;
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        this._bus.event.read.addHandler(this._onBusAccess, this);
        this._bus.event.write.addHandler(this._onBusAccess, this);

        return this;
    }

    private _onBusAccess(accessType: Bus.AccessType, self: Cartridge8040): void {
        const address = self._bus.getLastAddresBusValue() & 0x1840;

        switch (address) {
            case 0x0800:
                self._bank = self._bank0;
                break;

            case 0x0840:
                self._bank = self._bank1;
                break;
        }
    }

    private _bank: Uint8Array = null;
    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);

    private _bus: Bus = null;
}

export default Cartridge8040;
