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
import CpuInterface from '../../cpu/CpuInterface';
import Bus from '../Bus';
import CartridgeInfo from './CartridgeInfo';
import * as cartridgeUtil from './util';

class CartridgeFE extends AbstractCartridge {

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
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer,
            [
                [0x20, 0x00, 0xD0, 0xC6, 0xC5],  // JSR $D000; DEC $C5
                [0x20, 0xC3, 0xF8, 0xA5, 0x82],  // JSR $F8C3; LDA $82
                [0xD0, 0xFB, 0x20, 0x73, 0xFE],  // BNE $FB; JSR $FE73
                [0x20, 0x00, 0xF0, 0x84, 0xD6]   // JSR $F000; STY $D6
            ]
        );

        for (let i = 0; i < signatureCounts.length; i++) {
            if (signatureCounts[i] > 0) {
                return true;
            }
        }

        return false;
    }

    reset(): void {
        this._bank = this._bank0;
        this._lastAccessWasFE = false;
        this._lastAddressBusValue = -1;
    }

    read(address: number): number {
        return this._bank[address & 0x0FFF];
    }

    write(address: number, value: number): void {
        super.write(address, value);
    }

    setCpu(cpu: CpuInterface): this {
        this._cpu = cpu;

        return this;
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        this._bus.event.read.addHandler(CartridgeFE._onBusAccess, this);
        this._bus.event.write.addHandler(CartridgeFE._onBusAccess, this);

        return this;
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_FE;
    }

    private static _onBusAccess(accessType: Bus.AccessType, self: CartridgeFE): void {
        const lastAddressBusValue = self._lastAddressBusValue;
        self._lastAddressBusValue = self._bus.getLastAddresBusValue();

        if (self._lastAddressBusValue === lastAddressBusValue) {
            return;
        }

        if (self._lastAccessWasFE) {
            self._bank = (self._bus.getLastDataBusValue() & 0x20) > 0 ? self._bank0 : self._bank1;
        }

        self._lastAccessWasFE = self._bus.getLastAddresBusValue() === 0x01FE;
    }

    private _cpu: CpuInterface;
    private _bus: Bus;

    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);
    private _bank: Uint8Array;

    private _lastAccessWasFE = false;
    private _lastAddressBusValue = -1;
}

export default CartridgeFE;
