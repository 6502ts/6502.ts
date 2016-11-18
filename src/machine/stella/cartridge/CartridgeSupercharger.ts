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

import {bios} from './supercharger/blob';

const enum BankType {
    ram, rom
}

class CartridgeSupercharger extends AbstractCartridge {

    constructor(
        buffer: {[i: number]: number, length: number},
        private _showLoadingBars = true
    ) {
        super();

        if (buffer.length % 8448 !== 0) {
            throw new Error(`not a supercharger image --- invalid size`);
        }

        this._image = new Uint8Array(buffer);

        for (let i = 0; i < 3; i++) {
            this._ramBanks[i] = new Uint8Array(0x0800);
        }

        this._loadBios();

        this.reset();
    }

    reset() {
        this._setBankswitchMode(0);
        this._transitionCount = 0;
        this._pendingWrite = false;
        this._pendingWriteValue = 0;
        this._lastAddressBusValue = -1;
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        this._bus.event.read.addHandler(CartridgeSupercharger._onBusAccess, this);
        this._bus.event.write.addHandler(CartridgeSupercharger._onBusAccess, this);

        return this;
    }

    read(address: number): number {
        address &= 0x0FFF;

        return address < 0x0800 ? this._bank0[address] : this._bank1[address & 0x07FF];
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_supercharger;
    }

    private _setBankswitchMode(mode: number): void {
        switch (mode) {
            case 0:
                return this._configureBanks(2, BankType.rom);

            case 1:
                return this._configureBanks(0, BankType.rom);

            case 2:
                return this._configureBanks(2, BankType.ram, 0);

            case 3:
                return this._configureBanks(0, BankType.ram, 2);

            case 4:
                return this._configureBanks(2, BankType.rom);

            case 5:
                return this._configureBanks(1, BankType.rom);

            case 6:
                return this._configureBanks(2, BankType.ram, 1);

            case 7:
                return this._configureBanks(1, BankType.ram, 2);

            default:
                throw new Error('invalid bankswitching mode');
        }
    }

    private _configureBanks(bank0: number, bank1Type: BankType, bank1 = 0): void {
        this._bank0 = this._ramBanks[bank0];
        this._bank1Type = bank1Type;
        this._bank1 = bank1Type === BankType.ram ? this._ramBanks[bank1] : this._rom;
    }

    private _loadBios() {
        for (let i = 0; i < 0x0800; i++) {
            this._rom[i] = i < bios.length ? bios[i] : 0x02;
        }

        this._rom[109] = this._showLoadingBars ? 0 : 0xFF;

        this._rom[0x07FF] = this._rom[0x07FD] = 0xF8;
        this._rom[0x07FE] = this._rom[0x07FC] = 0x0A;
    }

    private static _onBusAccess(type: Bus.AccessType, self: CartridgeSupercharger) {
        const address = self._bus.getLastAddresBusValue();

        if (address !== self._lastAddressBusValue) {
            self._transitionCount++;
            self._lastAddressBusValue = address;
        }
    }

    private _bus: Bus;

    private _image: Uint8Array = null;

    private _rom = new Uint8Array(0x0800);
    private _ramBanks = new Array<Uint8Array>(3);

    private _bank0: Uint8Array = null;
    private _bank1: Uint8Array = null;
    private _bank1Type = BankType.rom;

    private _transitionCount = 0;
    private _pendingWriteValue = 0;
    private _pendingWrite = false;
    private _lastAddressBusValue = -1;
}

export default CartridgeSupercharger;