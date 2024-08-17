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
import RngInterface from '../../../tools/rng/GeneratorInterface';
import Bus from '../Bus';
import { BufferInterface } from './util';
import { CartridgeType } from './CartridgeInfo';

class CartridgePP extends AbstractCartridge {
    constructor(buffer: BufferInterface) {
        super();

        if (buffer.length !== 0x2000 && buffer.length !== 0x2003) {
            throw new Error(`buffer is not a PP cartridge image; wrong length ${buffer.length} bytes`);
        }

        for (let i = 0; i < 8; i++) {
            this._banks[i] = new Uint8Array(0x0400);

            for (let j = 0; j < 0x0400; j++) {
                this._banks[i][j] = buffer[i * 0x0400 + j];
            }
        }

        this.reset();
    }

    getType(): CartridgeType {
        return CartridgeType.bankswitch_8k_pp;
    }

    reset(): void {
        this._switchLayout(0);

        this._bankSwitchPending = false;
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < 0x40; i++) {
            this._ram[i] = rng.int(0xff);
        }
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        bus.event.read.addHandler(CartridgePP._onBusAccess, this);
        bus.event.write.addHandler(CartridgePP._onBusAccess, this);

        return this;
    }

    read(address: number): number {
        address &= 0x0fff;
        this._access(address, this._bus.getLastDataBusValue());

        if (address < 0x40) {
            return this._ram[address];
        }

        if (address < 0x80) {
            return this._bus.getLastDataBusValue();
        }

        return this._segments[address >>> 10][address & 0x03ff];
    }

    write(address: number, value: number) {
        this._access(address & 0x0fff, value);
    }

    peek(address: number): number {
        address &= 0x0fff;

        if (address < 0x40) {
            return this._ram[address];
        }

        if (address < 0x80) {
            return this._bus.getLastDataBusValue();
        }

        return this._segments[address >>> 10][address & 0x03ff];
    }

    private static _onBusAccess(accessType: Bus.AccessType, self: CartridgePP): void {
        let address = self._bus.getLastAddresBusValue();

        if (self._bankSwitchPending && address !== self._previousAddressBusValue && --self._accessCounter === 0) {
            self._switchLayout(self._pendingBank);
            self._bankSwitchPending = false;
        }

        if (address & 0x1000) {
            return;
        }

        address &= 0xff;

        if (address >= 0x30 && address <= 0x3f) {
            self._pendingBank = address & 0x0f;
            self._accessCounter = 3;
            self._bankSwitchPending = true;
        }
    }

    private _access(address: number, value: number): void {
        if (address >= 0x40 && address < 0x80) {
            this._ram[address - 0x40] = value;
        }
    }

    private _switchLayout(index: number): void {
        switch (index) {
            case 0:
            case 8:
                return this._configureSegments(0, 0, 1, 2);

            case 1:
            case 9:
                return this._configureSegments(0, 1, 3, 2);

            case 2:
            case 10:
                return this._configureSegments(4, 5, 6, 7);

            case 3:
            case 11:
                return this._configureSegments(7, 4, 3, 2);

            case 4:
            case 12:
                return this._configureSegments(0, 0, 6, 7);

            case 5:
            case 13:
                return this._configureSegments(0, 1, 7, 6);

            case 6:
            case 14:
                return this._configureSegments(3, 2, 4, 5);

            case 7:
            case 15:
                return this._configureSegments(6, 0, 5, 1);

            default:
                throw new Error('illegal layout index');
        }
    }

    private _configureSegments(zero: number, one: number, two: number, three: number): void {
        this._segments[0] = this._banks[zero];
        this._segments[1] = this._banks[one];
        this._segments[2] = this._banks[two];
        this._segments[3] = this._banks[three];
    }

    private _banks: Array<Uint8Array> = new Array(8);
    private _segments: Array<Uint8Array> = new Array(4);
    private _ram = new Uint8Array(0x40);

    private _bus: Bus;

    private _bankSwitchPending = false;
    private _pendingBank = 0;
    private _accessCounter = 0;
    private _previousAddressBusValue = 0;
}

export default CartridgePP;
