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
import * as cartridgeUtil from './util';
import CartridgeInfo from './CartridgeInfo';
import Bus from '../Bus';

import RngInterface from '../../../tools/rng/GeneratorInterface';

class Cartridge3E extends AbstractCartridge {

    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if ((buffer.length & 0x07FF) !== 0) {
            throw new Error(`buffer length ${buffer.length} is not a multiple of 2k`);
        }

        const bankCount = buffer.length >>> 11;
        if (bankCount < 2) {
            throw new Error('image must have at least 2k');
        }

        this._banks = new Array<Uint8Array>(bankCount);

        for (let i = 0; i < bankCount; i++) {
            this._banks[i] = new Uint8Array(0x0800);
        }

        for (let i = 0; i <= 0xFF; i++) {
            this._ramBanks[i] = new Uint8Array(0x0400);
        }

        this._ramBank = this._ramBanks[0];
        this._bank1 = this._banks[bankCount - 1];
        this._bank0 = this._banks[0];

        for (let i = 0; i < 0x0800; i++) {
            for (let j = 0; j < bankCount; j++) {
                this._banks[j][i] = buffer[0x0800 * j + i];
            }
        }
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        // Signature shamelessly stolen from stella
        const signatureCounts = cartridgeUtil.searchForSignatures(
            buffer,
            [[ 0x85, 0x3E, 0xA9, 0x00 ]]  // STA $3E, LDA #0
        );

        return signatureCounts[0] >= 1;
    }

    reset(): void {
        this._bank0 = this._banks[0];
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < this._ramBanks.length; i++) {
            for (let j = 0; j < 0x0400; j++) {
                this._ramBanks[i][j] = rng.int(0xFF);
            }
        }
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        // Bankswitch on read breaks actual cartridges badly -> maybe the hardware actively
        // watches out for STA on the bus? Disable for now, more research would be in order.
        //
        // this._bus.event.read.addHandler(Cartridge3E._onBusAccess, this);
        this._bus.event.write.addHandler(Cartridge3E._onBusAccess, this);

        return this;
    }

    read(address: number): number {
        address &= 0x0FFF;

        if (this._ramSelect) {
            if (address < 0x0400) {
                return this._ramBank[address];
            }

            if (address < 0x0800) {
                return this._ramBank[address & 0x03FF] = this._bus.getLastDataBusValue();
            }

            return this._bank1[address & 0x07FF];
        }

        return address < 0x0800 ? this._bank0[address] : this._bank1[address & 0x07FF];
    }

    peek(address: number): number {
        address &= 0x0FFF;

        if (this._ramSelect) {
            if (address < 0x0400) {
                return this._ramBank[address];
            }

            if (address < 0x0800) {
                return this._bus.getLastDataBusValue();
            }

            return this._bank1[address & 0x07FF];
        }

        return address < 0x0800 ? this._bank0[address] : this._bank1[address & 0x07FF];
    }

    write(address: number, value: number): void {
        if (!this._ramSelect) {
            return;
        }

        address &= 0x0FFF;

        if (address >= 0x0400 && address < 0x0800) {
            this._ramBank[address & 0x03FF] = value;
        }
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_3E;
    }

    private static _onBusAccess(accessType: Bus.AccessType, self: Cartridge3E): void {
        switch (self._bus.getLastAddresBusValue()) {
            case 0x003F:
                self._ramSelect = false;
                self._bank0 = self._banks[self._bus.getLastDataBusValue() % self._banks.length];
                break;

            case 0x003E:
                self._ramSelect = true;
                self._ramBank = self._ramBanks[self._bus.getLastDataBusValue() % 32];
                break;
        }
    }

    private _banks: Array<Uint8Array> = null;
    private _bank0: Uint8Array;
    private _bank1: Uint8Array;

    private _ramSelect = false;
    private _ramBanks = new Array<Uint8Array>(0x0100);
    private _ramBank: Uint8Array;

    private _bus: Bus = null;

}

export default Cartridge3E;
