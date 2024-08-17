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
import Bus from '../Bus';

import RngInterface from '../../../tools/rng/GeneratorInterface';
import { CartridgeType } from './CartridgeInfo';

class Cartridge3E extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if ((buffer.length & 0x07ff) !== 0) {
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

        for (let i = 0; i <= 0xff; i++) {
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
            [[0x85, 0x3e, 0xa9, 0x00]] // STA $3E, LDA #0
        );

        return signatureCounts[0] >= 1;
    }

    reset(): void {
        this._bank0 = this._banks[0];
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < this._ramBanks.length; i++) {
            for (let j = 0; j < 0x0400; j++) {
                this._ramBanks[i][j] = rng.int(0xff);
            }
        }
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        this._bus.event.read.addHandler(Cartridge3E._onBusAccess, this);
        this._bus.event.write.addHandler(Cartridge3E._onBusAccess, this);

        return this;
    }

    read(address: number): number {
        address &= 0x0fff;

        if (this._ramSelect) {
            if (address < 0x0400) {
                return this._ramBank[address];
            }

            if (address < 0x0800) {
                return (this._ramBank[address & 0x03ff] = this._bus.getLastDataBusValue());
            }

            return this._bank1[address & 0x07ff];
        }

        return address < 0x0800 ? this._bank0[address] : this._bank1[address & 0x07ff];
    }

    peek(address: number): number {
        address &= 0x0fff;

        if (this._ramSelect) {
            if (address < 0x0400) {
                return this._ramBank[address];
            }

            if (address < 0x0800) {
                return this._bus.getLastDataBusValue();
            }

            return this._bank1[address & 0x07ff];
        }

        return address < 0x0800 ? this._bank0[address] : this._bank1[address & 0x07ff];
    }

    write(address: number, value: number): void {
        if (!this._ramSelect) {
            return;
        }

        address &= 0x0fff;

        if (address >= 0x0400 && address < 0x0800) {
            this._ramBank[address & 0x03ff] = value;
        }
    }

    getType(): CartridgeType {
        return CartridgeType.bankswitch_3E;
    }

    private static _onBusAccess(accessType: Bus.AccessType, self: Cartridge3E): void {
        switch (self._bus.getLastAddresBusValue()) {
            case 0x003f:
                self._ramSelect = false;
                self._bank0 = self._banks[self._bus.getLastDataBusValue() % self._banks.length];
                break;

            case 0x003e:
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

export { Cartridge3E as default };
