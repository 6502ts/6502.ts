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
import CartridgeInfo from './CartridgeInfo';
import Bus from '../Bus';
import * as cartridgeUtil from './util';

const mixerTable = new Uint8Array([0x0, 0x4, 0x5, 0x9, 0x6, 0xa, 0xb, 0xf]);

class CartridgeDPC extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        if (buffer.length < 0x2800) {
            throw new Error(`buffer is not a DPC image: too small ${buffer.length}`);
        }

        for (let i = 0; i < 8; i++) {
            this._fetchers[i] = new Fetcher();
        }

        for (let i = 0; i < 0x1000; i++) {
            this._bank0[i] = buffer[i];
            this._bank1[i] = buffer[0x1000 + i];
        }

        for (let i = 0; i < 0x0800; i++) {
            this._fetcherData[i] = buffer[0x2000 + i];
        }

        this.reset();
    }

    reset(): void {
        this._bank = this._bank1;
        this._rng = 1;
        this._fetchers.forEach(fetcher => fetcher.reset());
        this._lastCpuTime = 0;
        this._clockAccumulator = 0;
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_8k_DPC;
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
        return this._bank[address & 0x0fff];
    }

    write(address: number, value: number): void {
        this._access(address, value);
    }

    private _access(address: number, value: number): number {
        address &= 0x0fff;

        if (address > 0x7f) {
            switch (address) {
                case 0x0ff8:
                    this._bank = this._bank0;
                    break;

                case 0x0ff9:
                    this._bank = this._bank1;
                    break;

                default:
                    break;
            }

            return this._bank[address];
        }

        if (address < 0x08) {
            if (address & 0x04) {
                this._clockMusicFetchers();

                return mixerTable[
                    (this._fetchers[5].mask & 0x4) | (this._fetchers[6].mask & 0x2) | (this._fetchers[7].mask & 0x1)
                ];
            } else {
                return this._randomNext();
            }
        }

        if (address < 0x40) {
            const fetcher = this._fetchers[(address - 8) & 0x07],
                mask = fetcher.mask;

            let fetchedData = this._fetcherData[0x07ff - fetcher.pointer];

            fetcher.next();

            switch ((address - 8) >>> 3) {
                case 0:
                    return fetchedData;

                case 1:
                    return fetchedData & mask;

                case 2:
                    fetchedData &= mask;
                    return ((fetchedData << 4) | (fetchedData >>> 4)) & 0xff;

                case 3:
                    fetchedData &= mask;

                    return (
                        ((fetchedData & 0x01) << 7) |
                        ((fetchedData & 0x02) << 5) |
                        ((fetchedData & 0x04) << 3) |
                        ((fetchedData & 0x08) << 1) |
                        ((fetchedData & 0x10) >>> 1) |
                        ((fetchedData & 0x20) >>> 3) |
                        ((fetchedData & 0x40) >>> 5) |
                        ((fetchedData & 0x80) >>> 7)
                    );

                case 4:
                    return (fetchedData & mask) >>> 1;

                case 5:
                    return (fetchedData << 1) & mask;

                case 6:
                    return mask;
            }
        }

        if (address < 0x60) {
            const fetcher = this._fetchers[(address - 0x40) & 0x07];

            switch ((address - 0x40) >>> 3) {
                case 0:
                    this._clockMusicFetchers();
                    fetcher.setStart(value);
                    break;

                case 1:
                    this._clockMusicFetchers();
                    fetcher.setEnd(value);
                    break;

                case 2:
                    fetcher.setLow(value);
                    break;

                case 3:
                    fetcher.setHigh(value);

                    if (address > 0x5c) {
                        fetcher.setMusicMode(value);
                    }

                    break;
            }

            return this._bank[address];
        }

        if (address >= 0x70 && address < 0x78) {
            this._rng = 1;

            return this._bank[address];
        }

        return this._bank[address];
    }

    private _randomNext(): number {
        const oldRng = this._rng;

        this._rng =
            ((this._rng << 1) |
                (~((this._rng >>> 7) ^ (this._rng >>> 5) ^ ((this._rng >>> 4) ^ (this._rng >>> 3))) & 0x01)) &
            0xff;

        return oldRng;
    }

    private _clockMusicFetchers(): void {
        const cpuTime = this._cpuTimeProvider();
        this._clockAccumulator += (cpuTime - this._lastCpuTime) * 21000;
        this._lastCpuTime = cpuTime;

        const clocks = Math.floor(this._clockAccumulator);
        this._clockAccumulator -= clocks;

        if (clocks === 0) {
            return;
        }

        for (let i = 5; i < 8; i++) {
            this._fetchers[i].forwardClock(clocks);
        }
    }

    private _bank0 = new Uint8Array(0x1000);
    private _bank1 = new Uint8Array(0x1000);

    private _bank: Uint8Array;

    private _fetcherData = new Uint8Array(0x0800);
    private _fetchers: Array<Fetcher> = new Array(8);

    private _rng = 1;

    private _bus: Bus;

    private _cpuTimeProvider: () => number = null;
    private _lastCpuTime = 0;
    private _clockAccumulator = 0;
}

class Fetcher {
    contructor() {
        this.reset();
    }

    reset() {
        this.pointer = this.start = this.end = this.mask = 0;
        this.musicMode = false;
    }

    next(): void {
        if (this.musicMode) {
            return;
        }

        this.pointer = (this.pointer + 0x07ff) & 0x07ff;

        this._updateMask();
    }

    setStart(start: number): void {
        this.start = start;
        this.mask = 0x00;

        this._updateMask();
    }

    setEnd(end: number): void {
        this.end = end;

        this._updateMask();
    }

    setLow(value: number): void {
        this.pointer = (this.pointer & 0x0700) | value;

        this._updateMask();
    }

    setHigh(value: number): void {
        this.pointer = (this.pointer & 0xff) | ((value & 0x07) << 8);

        this._updateMask();
    }

    setMusicMode(value: number): void {
        this.musicMode = (value & 0x10) !== 0;
    }

    forwardClock(clocks: number) {
        if (!this.musicMode) {
            return;
        }

        const period = this.start + 1,
            newPointerLow = ((this.pointer & 0xff) + period - clocks % period) % period,
            distanceStart = (256 + this.start - newPointerLow) & 0xff,
            distanceEnd = (256 + this.end - newPointerLow) & 0xff;

        this.pointer = (this.pointer & 0x0700) | newPointerLow;

        this.mask = distanceStart > distanceEnd ? 0 : 0xff;
    }

    private _updateMask(): void {
        if ((this.pointer & 0xff) === this.start) {
            this.mask = 0xff;
        }

        if ((this.pointer & 0xff) === this.end) {
            this.mask = 0x00;
        }
    }

    pointer = 0;
    start = 0;
    end = 0;
    musicMode = false;
    mask = 0x00;
}

export default CartridgeDPC;
