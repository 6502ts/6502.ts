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

import Thumbulator from 'thumbulator.ts';

import AbstractCartridge from './AbstractCartridge';
import CartridgeInfo from './CartridgeInfo';
import Bus from '../Bus';
import CartridgeInterface from './CartridgeInterface';
import * as cartridgeUtil from './util';
import { encode as hex } from '../../../tools/hex';

const enum CONST {
    returnAddress = 0x8004,
    trapReturn = 255,
    trapAbort = 10
}

function hostIsLittleEndian(): boolean {
    const buffer8 = new Uint8Array([1, 2, 3, 4]),
        buffer32 = new Uint32Array(buffer8.buffer);

    return buffer32[0] === 0x04030201;
}

class CartridgeDPCPlus extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length < 28 * 0x0400 || buffer.length > 0x8000) {
            throw new Error(`not a DPC+ image: invalid lenght ${buffer.length}`);
        }

        /* ROM layout:
         *
         *    3k ARM driver
         *    6 * 4k banks (either 6502 or ARM)
         *    4k image ROM
         *    1k frequency ROM
         */

        // ARM ROM: the whole ROM image, suitable for 16bit and 32bit access
        this._rom8 = new Uint8Array(this._romBuffer);
        this._rom16 = new Uint16Array(this._romBuffer);
        this._rom32 = new Uint32Array(this._romBuffer);

        for (let i = 0; i < 6; i++) {
            this._banks[i] = new Uint8Array(this._romBuffer, 0x0c00 + i * 0x1000, 0x1000);
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
        this._imageRam = new Uint8Array(this._ramBuffer, 0x0c00, 0x1000);

        const rom8 = new Uint8Array(this._romBuffer),
            offset = 0x8000 - buffer.length;

        for (let i = 0; i < buffer.length; i++) {
            rom8[offset + i] = buffer[i];
        }

        for (let i = 0; i < 8; i++) {
            this._fetchers[i] = new Fetcher();
            this._fractionalFetchers[i] = new FractionalFetcher();
        }

        for (let i = 0; i < 3; i++) {
            this._musicFetchers[i] = new MusicFetcher();
        }

        if (hostIsLittleEndian()) {
            // If we are on a little endian host, we use typed arrays to take advantage of
            // hardware word access
            this._getRom16 = address => this._rom16[address >>> 1];
            this._getRom32 = address => this._rom32[address >>> 2];
            this._getRam16 = address => this._ram16[address >>> 1];
            this._getRam32 = address => this._ram32[address >>> 2];
            this._setRam16 = (address, value) => (this._ram16[address >>> 1] = value);
            this._setRam32 = (address, value) => (this._ram32[address >>> 2] = value);
        } else {
            // On big endian, we dance the endianness shuffle ourselves (DataView is dead slow)
            this._getRom16 = address => this._rom8[address] | (this._rom8[address + 1] << 8);
            this._getRom32 = address =>
                this._rom8[address] |
                (this._rom8[address + 1] << 8) |
                (this._rom8[address + 2] << 16) |
                (this._rom8[address + 3] << 24);
            this._getRam16 = address => this._ram8[address] | (this._ram8[address + 1] << 8);
            this._getRam32 = address =>
                this._ram8[address] |
                (this._ram8[address + 1] << 8) |
                (this._ram8[address + 2] << 16) |
                (this._ram8[address + 3] << 24);
            this._setRam16 = (address, value) => {
                this._ram8[address] = value & 0xff;
                this._ram8[address + 1] = (value >>> 8) & 0xff;
            };
            this._setRam32 = (address, value) => {
                this._ram8[address] = value & 0xff;
                this._ram8[address + 1] = (value >>> 8) & 0xff;
                this._ram8[address + 2] = (value >>> 16) & 0xff;
                this._ram8[address + 3] = (value >>> 24) & 0xff;
            };
        }

        this.reset();
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer, ['DPC+'.split('').map(x => x.charCodeAt(0))]);

        return signatureCounts[0] === 2;
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

        for (let i = 0; i < 8; i++) {
            this._fetchers[i].reset();
            this._fractionalFetchers[i].reset();
        }

        for (let i = 0; i < 3; i++) {
            this._musicFetchers[i].reset();
        }

        this._parameterIndex = 0;

        this._fastFetch = this._ldaPending = false;

        this._rng = 0x2b435044;

        this._lastCpuTime = 0;
        this._clockAccumulator = 0;
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_dpc_plus;
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        return this;
    }

    setCpuTimeProvider(provider: () => number): void {
        this._cpuTimeProvider = provider;
    }

    read(address: number): number {
        return this._access(address, this._bus.getLastDataBusValue());
    }

    peek(address: number): number {
        return this._currentBank[address & 0x0fff];
    }

    write(address: number, value: number): void {
        this._access(address, value);
    }

    protected triggerTrap(reason: CartridgeInterface.TrapReason, message: string) {
        this._thumbulator.abort();

        super.triggerTrap(reason, message);
    }

    private _access(address: number, value: number): number {
        address &= 0x0fff;

        const readResult = this._currentBank[address];

        if (this._fastFetch && this._ldaPending && address > 0x7f && address < 0x0ff6 && readResult < 0x28) {
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
                            return this._rng & 0xff;

                        case 0x01:
                            this._rewindRng();
                            return this._rng & 0xff;

                        case 0x02:
                            return (this._rng >>> 8) & 0xff;

                        case 0x03:
                            return (this._rng >>> 16) & 0xff;

                        case 0x04:
                            return (this._rng >>> 24) & 0xff;

                        case 0x05: {
                            this._clockMusicFetchers();

                            let acc = 0;
                            for (let i = 0; i < 3; i++) {
                                acc += this._imageRam[
                                    (this._musicFetchers[i].waveform << 5) + this._musicFetchers[i].waveformSample()
                                ];
                            }

                            return acc & 0xff;
                        }
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
                    return idx < 4 ? fetcher.mask() : 0;

                default:
                    return 0;
            }
        } else if (address < 0x80) {
            const idx = address & 0x07,
                fetcher = this._fetchers[idx],
                fractionalFetcher = this._fractionalFetchers[idx];

            switch (((address - 0x28) >>> 3) & 0x0f) {
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
                    switch (idx) {
                        case 0x00:
                            this._fastFetch = value === 0;
                            break;

                        case 0x01:
                            if (this._parameterIndex < 8) {
                                this._parameters[this._parameterIndex++] = value;
                            }

                            break;

                        case 0x02:
                            this._dispatchFunction(value);
                            break;

                        case 0x05:
                        case 0x06:
                        case 0x07:
                            this._musicFetchers[idx - 0x05].waveform = value & 0x7f;
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
                            this._rng = 0x2b435044;
                            break;

                        case 0x01:
                            this._rng = (this._rng & 0xffffff00) | value;
                            break;

                        case 0x02:
                            this._rng = (this._rng & 0xffff00ff) | (value << 8);
                            break;

                        case 0x03:
                            this._rng = (this._rng & 0xff00ffff) | (value << 16);
                            break;

                        case 0x04:
                            this._rng = (this._rng & 0x00ffffff) | (value << 24);
                            break;

                        case 0x05:
                        case 0x06:
                        case 0x07:
                            this._musicFetchers[idx - 0x05].frequency = this._getRam32(0x2000 - 0x400 + (value << 2));
                            break;
                    }

                    break;

                case 0x0a:
                    this._imageRam[fetcher.pointer] = value;
                    fetcher.increment();
                    break;

                default:
                    break;
            }
        } else if (address > 0x0ff5 && address < 0x0ffc) {
            this._currentBank = this._banks[address - 0x0ff6];
        }

        if (this._fastFetch && address > 0x7f && address < 0x0ff6) {
            this._ldaPending = readResult === 0xa9;
        }

        return readResult;
    }

    private _clockMusicFetchers(): void {
        const cpuTime = this._cpuTimeProvider();

        this._clockAccumulator += (cpuTime - this._lastCpuTime) * 20000;
        this._lastCpuTime = cpuTime;

        const clocks = Math.floor(this._clockAccumulator);
        this._clockAccumulator -= clocks;

        if (clocks === 0) {
            return;
        }

        for (let i = 0; i < 3; i++) {
            this._musicFetchers[i].increment(clocks);
        }
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
                        0x0c00 + ((this._fetchers[this._parameters[2] & 0x07].pointer + i) & 0x0fff)
                    ] = this._rom8[0x0c00 + (romBase + i) % 0x7400];
                }

                this._parameterIndex = 0;
                break;

            case 2:
                for (let i = 0; i < this._parameters[3]; i++) {
                    this._ram8[
                        0x0c00 + ((this._fetchers[this._parameters[2] & 0x07].pointer + i) & 0x0fff)
                    ] = this._parameters[0];
                }

                this._parameterIndex = 0;
                break;

            case 254:
            case 255:
                this._dispatchArm();
                break;
        }
    }

    private _dispatchArm(): void {
        this._thumbulator.reset();
        this._thumbulator.enableDebug(false);

        for (let i = 0; i <= 12; i++) {
            this._thumbulator.writeRegister(i, 0);
        }

        this._thumbulator.writeRegister(13, 0x40001fb4);
        this._thumbulator.writeRegister(14, CONST.returnAddress - 1);
        this._thumbulator.writeRegister(15, 0x0c0b);

        this._armMamcr = 0;

        const trap = this._thumbulator.run(500000);

        if (trap !== CONST.trapReturn && trap !== Thumbulator.TrapReason.abort) {
            this.triggerTrap(CartridgeInterface.TrapReason.other, `ARM execution trapped: ${trap}`);
        }
    }

    private _advanceRng(): void {
        this._rng = (this._rng & (1 << 10) ? 0x10adab1e : 0x00) ^ ((this._rng >>> 11) | (this._rng << 21));
    }

    private _rewindRng(): void {
        this._rng =
            this._rng & (1 << 31)
                ? ((0x10adab1e ^ this._rng) << 11) | ((0x10adab1e ^ this._rng) >>> 21)
                : (this._rng << 11) | (this._rng >>> 21);
    }

    private _getRom16: (address: number) => number;
    private _getRom32: (address: number) => number;
    private _getRam16: (address: number) => number;
    private _getRam32: (address: number) => number;
    private _setRam16: (address: number, value: number) => void;
    private _setRam32: (address: number, value: number) => void;

    private _romBuffer = new ArrayBuffer(0x8000);

    private _rom8: Uint8Array;
    private _rom16: Uint16Array;
    private _rom32: Uint32Array;

    private _banks = new Array<Uint8Array>(6);
    private _currentBank: Uint8Array;

    private _ramBuffer = new ArrayBuffer(0x2000);

    private _ram8: Uint8Array;
    private _ram16: Uint16Array;
    private _ram32: Uint32Array;

    private _imageRam: Uint8Array;

    private _fetchers = new Array<Fetcher>(8);
    private _fractionalFetchers = new Array<FractionalFetcher>(8);
    private _musicFetchers = new Array<MusicFetcher>(3);

    private _parameters = new Uint8Array(8);
    private _parameterIndex = 0;

    private _rng = 0;

    private _clockAccumulator = 0;
    private _lastCpuTime = 0;

    private _fastFetch = false;
    private _ldaPending = false;

    private _bus: Bus;
    private _cpuTimeProvider: () => number = null;

    private _thumbulatorBus: Thumbulator.Bus = {
        read16: (address: number): number => {
            if (address & 0x01) {
                this.triggerTrap(
                    CartridgeInterface.TrapReason.other,
                    `unaligned 16 bit ARM read from ${hex(address, 8, false)}`
                );
                return 0;
            }

            const region = address >>> 28,
                addr = address & 0x0fffffff;

            switch (region) {
                case 0x0:
                    if (addr < 0x8000) {
                        return this._getRom16(addr);
                    }
                    break;

                case 0x4:
                    if (addr < 0x2000) {
                        return this._getRam16(addr);
                    }
                    break;

                case 0xe:
                    switch (addr) {
                        case 0x001fc000:
                            return this._armMamcr;
                    }

                    break;

                default:
            }

            this.triggerTrap(
                CartridgeInterface.TrapReason.other,
                `invalid 16 bit ARM read from ${hex(address, 8, false)}`
            );
        },

        read32: (address: number): number => {
            if (address & 0x03) {
                this.triggerTrap(
                    CartridgeInterface.TrapReason.other,
                    `unaligned 32 bit ARM read from ${hex(address, 8, false)}`
                );
                return 0;
            }

            const region = address >>> 28,
                addr = address & 0x0fffffff;

            switch (region) {
                case 0x0:
                    if (addr < 0x8000) {
                        return this._getRom32(addr);
                    }
                    break;

                case 0x4:
                    if (addr < 0x2000) {
                        return this._getRam32(addr);
                    }
                    break;

                case 0xe:
                    switch (addr) {
                        case 0x8004:
                        case 0x8008:
                            return 0;
                    }

                    break;

                default:
            }

            this.triggerTrap(
                CartridgeInterface.TrapReason.other,
                `invalid 32 bit ARM read from ${hex(address, 8, false)}`
            );
        },

        write16: (address: number, value: number): void => {
            if (address & 0x01) {
                this.triggerTrap(
                    CartridgeInterface.TrapReason.other,
                    `unaligned 16 bit ARM write: ${hex(value, 4)} -> ${hex(address, 8, false)}`
                );
                return;
            }

            const region = address >>> 28,
                addr = address & 0x0fffffff;

            switch (region) {
                case 0x04:
                    if (addr < 0x2000) {
                        this._setRam16(addr, value & 0xffff);
                        return;
                    }
                    break;

                case 0xe:
                    switch (addr) {
                        case 0x001fc000:
                            this._armMamcr = value;
                            return;
                    }

                    break;
            }

            this.triggerTrap(
                CartridgeInterface.TrapReason.other,
                `invalid 16 bit ARM write: ${hex(value, 4)} -> ${hex(address, 8, false)}`
            );
        },

        write32: (address: number, value: number): void => {
            if (address & 0x03) {
                this.triggerTrap(
                    CartridgeInterface.TrapReason.other,
                    `unaligned 32 bit ARM write: ${hex(value, 8, false)} -> ${hex(address, 8, false)}`
                );
                return;
            }

            const region = address >>> 28,
                addr = address & 0x0fffffff;

            switch (region) {
                case 0x4:
                    if (addr < 0x2000) {
                        this._setRam32(addr, value);
                        return;
                    }

                case 0xe:
                    switch (addr) {
                        case 0x8004:
                        case 0x8008:
                            return;
                    }

                    break;
            }

            this.triggerTrap(
                CartridgeInterface.TrapReason.other,
                `invalid 32 bit ARM write: ${hex(value, 8, false)} -> ${hex(address, 8, false)}`
            );
        }
    };

    private _armMamcr = 0;

    private _thumbulator = new Thumbulator(this._thumbulatorBus, {
        trapOnInstructionFetch: address => (address === 0x8004 ? CONST.trapReturn : 0)
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
        this.pointer = (this.pointer & 0xff) | ((value & 0x0f) << 8);
    }

    setPointerLo(value: number): void {
        this.pointer = (this.pointer & 0x0f00) | (value & 0xff);
    }

    increment(): void {
        this.pointer = (this.pointer + 1) & 0xfff;
    }

    decrement(): void {
        this.pointer = (this.pointer + 0xfff) & 0xfff;
    }

    mask(): number {
        return ((this.top - (this.pointer & 0xff)) & 0xff) > ((this.top - this.bottom) & 0xff) ? 0xff : 0;
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
        this.pointer = (this.pointer & 0x00ffff) | ((value & 0x0f) << 16);
    }

    setPointerLo(value: number): void {
        this.pointer = (this.pointer & 0x0f00ff) | ((value & 0xff) << 8);
    }

    setFraction(value: number): void {
        this.fraction = value;
        this.pointer &= 0x0fff00;
    }

    increment(): void {
        this.pointer = (this.pointer + this.fraction) & 0x0fffff;
    }

    pointer = 0;
    fraction = 0;
}

class MusicFetcher {
    constructor() {
        this.reset();
    }

    reset(): void {
        this.frequency = 0;
        this.waveform = 0;
        this.counter = 0;
    }

    increment(clocks: number): void {
        this.counter = (this.counter + clocks * this.frequency) | 0;
    }

    waveformSample(): number {
        return this.counter >>> 27;
    }

    frequency = ~0;
    counter = ~0;
    waveform = 0;
}

export default CartridgeDPCPlus;
