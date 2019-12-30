/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import AbstractCartridge from './AbstractCartridge';
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
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer, [
            [0x20, 0x00, 0xd0, 0xc6, 0xc5], // JSR $D000; DEC $C5
            [0x20, 0xc3, 0xf8, 0xa5, 0x82], // JSR $F8C3; LDA $82
            [0xd0, 0xfb, 0x20, 0x73, 0xfe], // BNE $FB; JSR $FE73
            [0x20, 0x00, 0xf0, 0x84, 0xd6] // JSR $F000; STY $D6
        ]);

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
        return this._bank[address & 0x0fff];
    }

    write(address: number, value: number): void {
        super.write(address, value);
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
        const previousAddressBusValue = self._lastAddressBusValue;
        self._lastAddressBusValue = self._bus.getLastAddresBusValue() & 0x1fff;

        if (self._lastAddressBusValue === previousAddressBusValue) {
            return;
        }

        if (self._lastAccessWasFE) {
            const dataBusHiBits = self._bus.getLastDataBusValue() & 0xe0;

            self._bank =
                dataBusHiBits === 0
                    ? self._bank0
                    : (self._bus.getLastDataBusValue() & 0x20) > 0
                        ? self._bank0
                        : self._bank1;
        }

        self._lastAccessWasFE = self._lastAddressBusValue === 0x01fe;
    }

    private _bus: Bus;

    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);
    private _bank: Uint8Array;

    private _lastAccessWasFE = false;
    private _lastAddressBusValue = -1;
}

export { CartridgeFE as default };
