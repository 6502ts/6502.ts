/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2017  Christian Speckner & contributors
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
import Thumbulator from './thumbulator/Thumbulator';
import CartridgeInterface from './CartridgeInterface';
import * as cartridgeUtil from './util';
import {encode as hex} from '../../../tools/hex';

const enum CONST {
    returnAddress = 0x8004,
    trapReturn = 255
};

class CartridgeDPCPlus extends AbstractCartridge {

    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length < 28 * 0x0400 || buffer.length > 0x8000) {
            throw new Error(`not a DPC+ image: invalid lenght ${buffer.length}`);
        }

        // ARM ROM: the whole ROM image, suitable for 16bit and 32bit access
        this._rom8 = new Uint8Array(this._romBuffer);
        this._rom16 = new Uint16Array(this._romBuffer);
        this._rom32 = new Uint32Array(this._romBuffer);

        /* ROM layout:
         *
         *    3k ARM driver
         *    6 * 4k banks (either 6502 or ARM)
         *    4k image ROM
         *    1k frequency ROM
         */
        this._imageRom = new Uint8Array(this._romBuffer, 0x8000 - 0x1400, 0x1000);
        this._frequencyRom = new Uint8Array(this._romBuffer, 0x8000 - 0x0400);

        for (let i = 0; i < 6; i++) {
            this._banks[i] = new Uint8Array(this._romBuffer, 0x0C00 + i * 0x1000, 0x1000);
        }

        // ARM RAM
        this._ram8 = new Uint8Array(this._ramBuffer);
        this._ram16 = new Uint16Array(this._ramBuffer);
        this._ram32 = new Uint32Array(this._ramBuffer);

        /* RAM layout
         *
         *    * 3k driver (copied to RAM)
         *    * 4k display RAM
         *    * 1k frequency RAM
         */
        this._imageRam = new Uint8Array(this._ramBuffer, 0x0C00, 0x1000);
        this._frequencyRam = new Uint8Array(this._ramBuffer, 0x2000 - 0x0400);

        const rom8 = new Uint8Array(this._romBuffer),
            offset = 0x8000 - buffer.length;

        for (let i = 0; i < buffer.length; i++) {
            rom8[offset + i] = buffer[i];
        }

        for (let i = 0; i < 8; i++) {
            this._fetchers[i] = new Fetcher();
            this._fractionalFetchers[i] = new FractionalFetcher();
        }

        this.reset();
    }

    reset() {
        this._currentBank = this._banks[5];

        for (let i = 0; i < 0x0300; i++) {
            this._ram32[i] = this._rom32[i];
        }

        for (let i = 0x1b00; i < 0x2000; i++) {
            this._ram32[0x0300 + i - 0x1b00] = this._rom32[i];
        }

        this._currentBank = this._banks[5];

        for (let i = 0; i < 8; i++) {
            this._parameters[i] = 0;
        }

        this._parameterIndex = 0;

        this._fastFetch = this._ldaPending = false;

        this._rng = 0x2B435044;
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_dpc_plus;
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    read(address: number): number {
        return this._access(address, this._bus.getLastDataBusValue());
    }

    peek(address: number): number {
        return this._currentBank[address & 0x0FFF];
    }

    write(address: number, value: number): void {
        this._access(address, value);
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        const signatureCounts = cartridgeUtil.searchForSignatures(
            buffer,
            ['DPC+'.split('').map(x => x.charCodeAt(0))]
        );

        return signatureCounts[0] === 2;
    }

    private _access(address: number, value: number): number {
        address &= 0x0FFF;

        const readResult = this._currentBank[address];

        if (this._fastFetch && this._ldaPending && address > 0x7F && address < 0x0FF6 && readResult < 0x28) {
            address = readResult;
        }

        this._ldaPending = false;

        if (address < 0x28) {
            const idx = address & 0x07,
                fetcher = this._fetchers[idx],
                fractionalFetcher = this._fractionalFetchers[idx];
            let result = 0;

            switch ((address >>> 3) & 0x07) {
                case 0x00:
                    switch (idx) {
                        case 0x00:
                            this._advanceRng();
                            return this._rng & 0xFF;

                        case 0x01:
                            this._rewindRng();
                            return this._rng & 0xFF;

                        case 0x02:
                            return (this._rng >>> 8) & 0xFF;

                        case 0x03:
                            return (this._rng >>> 16) & 0xFF;

                        case 0x04:
                            return (this._rng >>> 24) & 0xFF;
                    }

                    return 0;

                case 0x01:
                    result = this._imageRam[fetcher.pointer];
                    fetcher.increment();
                    return result;

                case 0x02:
                    result = this._imageRam[fetcher.pointer] & fetcher.mask();
                    fetcher.increment();
                    return result;

                case 0x03:
                    result = this._imageRam[fractionalFetcher.pointer >>> 8];
                    fractionalFetcher.increment();
                    return result;

                case 0x04:
                    return (idx < 4) ? fetcher.mask() : 0;

                default:
                    return 0;
            }
        } else if (address < 0x80) {
            const idx = address & 0x07,
                fetcher = this._fetchers[idx],
                fractionalFetcher = this._fractionalFetchers[idx];

            switch (((address - 0x28) >>> 3) & 0x0F) {
                case 0x00:
                    fractionalFetcher.setPointerLo(value);
                    break;

                case 0x01:
                    fractionalFetcher.setPointerHi(value);
                    break;

                case 0x02:
                    fractionalFetcher.setFraction(value);
                    break;

                case 0x03:
                    fetcher.top = value;
                    break;

                case 0x04:
                    fetcher.bottom = value;
                    break;

                case 0x05:
                    fetcher.setPointerLo(value);
                    break;

                case 0x06:
                    switch (idx)  {
                        case 0x00:
                            this._fastFetch = (value === 0);
                            break;

                        case 0x01:
                            if (this._parameterIndex < 8) {
                                this._parameters[this._parameterIndex++] = value;
                            }

                            break;

                        case 0x02:
                             this._dispatchFunction(value);
                             break;
                    }

                    break;

                case 0x07:
                    fetcher.decrement();
                    this._imageRam[fetcher.pointer] = value;
                    break;

                case 0x08:
                    fetcher.setPointerHi(value);
                    break;

                case 0x09:
                    switch (idx) {
                        case 0x00:
                            this._rng = 0x2B435044;
                            break;

                        case 0x01:
                            this._rng = (this._rng & 0xFFFFFF00) | value;
                            break;

                        case 0x02:
                            this._rng = (this._rng & 0xFFFF00FF) | (value << 8);
                            break;

                        case 0x03:
                            this._rng = (this._rng & 0xFF00FFFF) | (value << 16);
                            break;

                        case 0x04:
                            this._rng = (this._rng & 0x00FFFFFF) | (value << 24);
                            break;
                    }

                    break;

                case 0x0A:
                    this._imageRam[fetcher.pointer] = value;
                    fetcher.increment();
                    break;

                default:
                    break;
            }

        } else if (address > 0x0FF5 && address < 0x0FFC) {
            this._currentBank = this._banks[address - 0x0FF6];
        }

        if (this._fastFetch && address > 0x7F && address < 0x0FF6) {
            this._ldaPending = (readResult === 0xA9);
        }

        return readResult;
    }

    private _dispatchFunction(index: number) {
        const romBase = this._parameters[0] + (this._parameters[1] << 8);

        switch (index) {
            case 0:
                this._parameterIndex = 0;
                break;

            case 1:
                for (let i = 0; i < this._parameters[3]; i++) {
                    this._ram8[
                        0x0C00 + ((this._fetchers[this._parameters[2] & 0x07].pointer + i) & 0x0FFF)
                    ] = this._rom8[
                        0x0C00 + ((romBase + i) % 0x7400)
                    ];
                }

                this._parameterIndex = 0;
                break;

            case 2:
                for (let i = 0; i < this._parameters[3]; i++) {
                    this._ram8[
                        0x0C00 + ((this._fetchers[this._parameters[2] & 0x07].pointer + i) & 0x0FFF)
                    ] = this._parameters[0];
                }

                this._parameterIndex = 0;
                break;

            case 254:
            case 255:
                this._dispatchArm();
        }
    }

    private _dispatchArm(): void {
        this._thumbulator.reset();
        this._thumbulator.enableDebug(false);

        for (let i = 0; i <= 12; i++) {
            this._thumbulator.writeRegister(i, 0);
        }

        this._thumbulator.writeRegister(13, 0x40001FB4);
        this._thumbulator.writeRegister(14, CONST.returnAddress - 1);
        this._thumbulator.writeRegister(15, 0x0C0B);

        this._armMamcr = 0;

        const trap = this._thumbulator.run(100000);

        if (trap !== CONST.trapReturn) {
            this.triggerTrap(
                CartridgeInterface.TrapReason.other,
                `ARM execution trapped: ${trap}`
            );
        }
    }

    private _advanceRng(): void {
        this._rng = ((this._rng & (1<<10)) ? 0x10adab1e: 0x00) ^
            ((this._rng >>> 11) | (this._rng << 21));
    }

    private _rewindRng(): void {
        this._rng = ((this._rng & (1<<31)) ?
            ((0x10adab1e^this._rng) << 11) | ((0x10adab1e^this._rng) >>> 21) :
            (this._rng << 11) | (this._rng >>> 21));
    }

    private _romBuffer = new ArrayBuffer(0x8000);

    private _rom8: Uint8Array;
    private _rom16: Uint16Array;
    private _rom32: Uint32Array;

    private _imageRom: Uint8Array;
    private _frequencyRom: Uint8Array;

    private _banks = new Array<Uint8Array>(6);
    private _currentBank: Uint8Array;

    private _ramBuffer = new ArrayBuffer(0x2000);

    private _ram8: Uint8Array;
    private _ram16: Uint16Array;
    private _ram32: Uint32Array;

    private _imageRam: Uint8Array;
    private _frequencyRam: Uint8Array;

    private _fetchers = new Array<Fetcher>(8);
    private _fractionalFetchers = new Array<FractionalFetcher>(8);

    private _parameters = new Uint8Array(8);
    private _parameterIndex = 0;

    private _rng = 0;

    private _fastFetch = false;
    private _ldaPending = false;

    private _bus: Bus;

    private _thumbulatorBus: Thumbulator.Bus = {
        read16: (address: number): number => {
            if (address & 0x01) {
                this.triggerTrap(
                    CartridgeInterface.TrapReason.other,
                    `unaligned 16 bit ARM read from ${hex(address, 8)}`
                );
                return;
            }

            const region = address >>> 28,
                addr = address & 0x0FFFFFFF;

            switch (region) {
                case 0x0:
                    if (addr < 0x8000) {
                        return this._rom16[addr >>> 1];
                    }
                    break;

                case 0x4:
                    if (addr < 0x2000) {
                        return this._ram16[addr >>> 1];
                    }
                    break;

                case 0xE:
                    if (addr === 0x001FC000) {
                        return this._armMamcr;
                    }
                    break;

                default:
            }

            this.triggerTrap(
                CartridgeInterface.TrapReason.other,
                `invalid 16 bit ARM read from ${hex(address, 8)}`
            );
        },

        read32: (address: number): number => {
            if (address & 0x03) {
                this.triggerTrap(
                    CartridgeInterface.TrapReason.other,
                    `unaligned 32 bit ARM read from ${hex(address, 8)}`
                );
                return;
            }

            const region = address >>> 28,
                addr = address & 0x0FFFFFFF;

            switch (region) {
                case 0x0:
                    if (addr < 0x8000) {
                        return this._rom32[addr >>> 2];
                    }
                    break;

                case 0x4:
                    if (addr < 0x2000) {
                        return this._ram32[addr >>> 2];
                    }
                    break;

                default:
            }

            this.triggerTrap(
                CartridgeInterface.TrapReason.other,
                `invalid 32 bit ARM read from ${hex(address, 8)}`
            );
        },

        write16: (address: number, value: number): void => {
            if (address & 0x01) {
                this.triggerTrap(
                    CartridgeInterface.TrapReason.other,
                    `unaligned 16 bit ARM write: ${hex(value, 4)} -> ${hex(address, 8)}`
                );
                return;
            }

            const region = address >>> 28,
                addr = address & 0x0FFFFFFF;

            switch (region) {
                case 0x04:
                    if (addr < 0x2000) {
                        this._ram16[addr >>> 1] = value & 0xFFFF;
                        return;
                    }
                    break;

                case 0xE:
                    if (addr === 0x001FC000) {
                        this._armMamcr = value;
                        return;
                    }
                    break;
            }

            this.triggerTrap(
                CartridgeInterface.TrapReason.other,
                `invalid 16 bit ARM write: ${hex(value, 4)} -> ${hex(address, 8)}`
            );
        },

        write32: (address: number, value: number): void => {
            if (address & 0x03) {
                this.triggerTrap(
                    CartridgeInterface.TrapReason.other,
                    `unaligned 32 bit ARM write: ${hex(value, 8)} -> ${hex(address, 8)}`
                );
                return;
            }

            const region = address >>> 28,
                addr = address & 0x0FFFFFFF;

            if (region === 0x4 && addr < 0x2000) {
                this._ram32[addr >>> 2] = value;
                return;
            }

            this.triggerTrap(
                CartridgeInterface.TrapReason.other,
                `invalid 32 bit ARM write: ${hex(value, 8)} -> ${hex(address, 8)}`
            );
        }
    };

    private _armMamcr = 0;

    private _thumbulator = new Thumbulator(this._thumbulatorBus, {
        trapOnInstructionFetch: address => address === 0x8004 ? CONST.trapReturn : 0
    });

}

class Fetcher {

    contructor() {
        this.reset();
    }

    reset() {
        this.pointer = this.top = this.bottom = 0;
    }

    setPointerHi(value: number): void {
        this.pointer = (this.pointer & 0xFF) | ((value & 0x0F) << 8);
    }

    setPointerLo(value: number): void {
        this.pointer = (this.pointer & 0x0F00) | (value & 0xFF);
    }

    increment(): void {
        this.pointer = (this.pointer + 1) & 0xFFF;
    }

    decrement(): void {
        this.pointer = (this.pointer + 0xFFF) & 0xFFF;
    }

    mask(): number {
        return ((this.top - (this.pointer & 0xFF)) & 0xFF) > ((this.top - this.bottom) & 0xFF) ? 0xFF : 0;
    }

    pointer = 0;
    top = 0;
    bottom = 0;

}

class FractionalFetcher {

    contructor() {
        this.reset();
    }

    reset() {
        this.pointer = this.fraction = 0;
    }

    setPointerHi(value: number): void {
        this.pointer = (this.pointer & 0x00FFFF) | ((value & 0x0F) << 16);
    }

    setPointerLo(value: number): void {
        this.pointer = (this.pointer & 0x0F00FF) | ((value & 0xFF) << 8);
    }

    setFraction(value: number): void {
        this.fraction = value;
        this.pointer &= 0x0FFF00;
    }

    increment(): void {
        this.pointer = (this.pointer + this.fraction) & 0x0FFFFF;
    }

    pointer = 0;
    fraction = 0;

}

export default CartridgeDPCPlus;