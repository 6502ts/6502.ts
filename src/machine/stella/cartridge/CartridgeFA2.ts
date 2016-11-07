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
import RngInterface from '../../../tools/rng/GeneratorInterface';
import Bus from '../Bus';
import * as cartridgeUtil from './util';

const enum IODelay {
    load = 10,
    sace = 100
};

class CartridgeFA2 extends AbstractCartridge {

    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length !== 0x7000 && buffer.length !== 0x7400) {
            throw new Error(`buffer is not a 28k/29k cartridge image: wrong length ${buffer.length}`);
        }

        for (let i = 0; i < 7; i++) {
            this._banks[i] = new Uint8Array(0x1000);
        }

        const offset = buffer.length === 0x7000 ? 0 : 0x0400;

        for (let i = 0; i < 0x1000; i++) {
            for (let j = 0; j < 7; j++) {
                this._banks[j][i] = buffer[j * 0x1000 + i + offset];
            }
        }

        this.reset();
    }

    reset(): void {
        this._accessCounter = 0;
        this._accessCounterLimit = 0;
        this._bank = this._banks[0];
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_FA2;
    }

    randomize(rng: RngInterface): void {
        for (let i = 0; i < this._ram.length; i++) {
            this._ram[i] = rng.int(0xFF);
        }
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    read(address: number): number {
        this.write(address & 0x0FFF, this._bus.getLastDataBusValue());

        return this.peek(address);
    }

    peek(address: number): number {
        address &= 0x0FFF;

        if (address >= 0x0100 && address < 0x0200) {
            return this._ram[address - 0x0100];
        } else if (address === 0x0FF4) {
            return this._accessCounter >= this._accessCounterLimit ?
                // bit 6 zero: operation complete
                (this._bank[address] & ~0x40) :
                // bit 6 one: operation pending
                (this._bank[address] | 0x40);
        } else {
            return this._bank[address];
        }
    }

    write(address: number, value: number): void {
        address &= 0x0FFF;

        this._accessCounter++;

        if (address < 0x0100) {
            this._ram[address] = value;
            return;
        }

        if (address === 0x0FF4) {
            return this._handleIo();
        }

        if (address >= 0x0FF5 && address <= 0x0FFB) {
            this._bank = this._banks[address - 0x0FF5];
        }
    }

    private _handleIo(): void {
        if (this._accessCounter < this._accessCounterLimit) {
            return;
        }

        if (this._ram[0xFF] === 1) {
            for (let i = 0; i < 0x100; i++) {
                this._ram[i] = this._savedRam[i];
            }

            this._accessCounterLimit = IODelay.load;
        }
        else if (this._ram[0xFF] === 2) {
            for (let i = 0; i < 0x100; i++) {
                this._savedRam[i] = this._ram[i];
            }

            this._accessCounterLimit = IODelay.sace;
        }
        else {
            return;
        }

        this._accessCounter = 0;
        this._ram[0xFF] = 0;
    }

    private _bank: Uint8Array;
    private _banks = new Array<Uint8Array>(7);
    private _ram = new Uint8Array(0x100);

    private _savedRam = new Uint8Array(0x100);
    private _accessCounter = 0;
    private _accessCounterLimit = 0;

    private _bus: Bus;
}

export default CartridgeFA2;