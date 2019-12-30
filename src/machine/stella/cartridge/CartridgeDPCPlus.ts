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

import HarmonySoc from './harmony/Soc';
import AbstractCartridge from './AbstractCartridge';
import CartridgeInfo from './CartridgeInfo';
import Bus from '../Bus';
import CartridgeInterface from './CartridgeInterface';
import * as cartridgeUtil from './util';

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

        this._rom = this._soc.getRom();

        for (let i = 0; i < 6; i++) {
            this._banks[i] = new Uint8Array(this._rom.buffer, 0x0c00 + i * 0x1000, 0x1000);
        }

        // ARM RAM
        this._ram = this._soc.getRam();

        this._imageRam = new Uint8Array(this._ram.buffer, 0x0c00, 0x1000);

        /* RAM layout
         *
         *    * 3k driver (copied to RAM)
         *    * 4k display RAM
         *    * 1k frequency RAM
         */

        const offset = 0x8000 - buffer.length;

        for (let i = 0; i < buffer.length; i++) {
            this._rom[offset + i] = buffer[i];
        }

        for (let i = 0; i < 8; i++) {
            this._fetchers[i] = new Fetcher();
            this._fractionalFetchers[i] = new FractionalFetcher();
        }

        for (let i = 0; i < 3; i++) {
            this._musicFetchers[i] = new MusicFetcher();
        }

        this._soc.trap.addHandler(message => this.triggerTrap(CartridgeInterface.TrapReason.other, message));

        this.reset();
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        const signatureCounts = cartridgeUtil.searchForSignatures(buffer, ['DPC+'.split('').map(x => x.charCodeAt(0))]);

        return signatureCounts[0] === 2;
    }

    init(): Promise<void> {
        return this._soc.init();
    }

    reset() {
        this._soc.reset();

        this._currentBank = this._banks[5];

        for (let i = 0; i < 0x0300; i++) {
            this._soc.setRam32(i << 2, this._soc.getRom32(i << 2));
        }

        for (let i = 0x1b00; i < 0x2000; i++) {
            this._soc.setRam32((0x0300 + i - 0x1b00) << 2, this._soc.getRom32(i << 2));
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

    setCpuTimeProvider(provider: () => number): this {
        this._cpuTimeProvider = provider;

        return this;
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
                            this._musicFetchers[idx - 0x05].frequency = this._soc.getRam32(
                                0x2000 - 0x400 + (value << 2)
                            );
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
                    this._ram[0x0c00 + ((this._fetchers[this._parameters[2] & 0x07].pointer + i) & 0x0fff)] = this._rom[
                        0x0c00 + (romBase + i) % 0x7400
                    ];
                }

                this._parameterIndex = 0;
                break;

            case 2:
                for (let i = 0; i < this._parameters[3]; i++) {
                    this._ram[
                        0x0c00 + ((this._fetchers[this._parameters[2] & 0x07].pointer + i) & 0x0fff)
                    ] = this._parameters[0];
                }

                this._parameterIndex = 0;
                break;

            case 254:
            case 255:
                this._soc.run(0x0c0b);
                break;
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

    private _rom: Uint8Array;
    private _banks = new Array<Uint8Array>(6);
    private _currentBank: Uint8Array;

    private _ram: Uint8Array;
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

    private _soc = new HarmonySoc();
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

export { CartridgeDPCPlus as default };
