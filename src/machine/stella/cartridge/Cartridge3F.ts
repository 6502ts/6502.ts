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
