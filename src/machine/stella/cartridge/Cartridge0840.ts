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
import * as cartridgeUtil from './util';
import { CartridgeType } from './CartridgeInfo';

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
            [0x0c, 0xff, 0x0f, 0x4c], // NOP $0FFF; JMP ...
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

    getType(): CartridgeType {
        return CartridgeType.bankswitch_8k_econobanking;
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

export { Cartridge8040 as default };
