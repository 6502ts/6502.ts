/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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
import RngInterface from '../../../tools/rng/GeneratorInterface';

import Header from './supercharger/Header';
import { bios } from './supercharger/blob';

const enum BankType {
    ram,
    rom
}

class CartridgeSupercharger extends AbstractCartridge {
    constructor(buffer: { [i: number]: number; length: number }) {
        super();

        if (buffer.length % 8448 !== 0) {
            throw new Error(`not a supercharger image --- invalid size`);
        }

        this._loadCount = buffer.length / 8448;

        this._loads = new Array<Uint8Array>(this._loadCount);
        this._headers = new Array<Header>(this._loadCount);

        for (let i = 0; i < this._loadCount; i++) {
            this._loads[i] = new Uint8Array(8448);
        }

        for (let i = 0; i < 8448; i++) {
            for (let j = 0; j < this._loadCount; j++) {
                this._loads[j][i] = buffer[j * 8448 + i];
            }
        }

        for (let i = 0; i < this._loadCount; i++) {
            this._headers[i] = new Header(this._loads[i]);

            if (!this._headers[i].verify()) {
                console.log(`load ${i} has invalid checksum`);
            }
        }

        for (let i = 0; i < 3; i++) {
            this._ramBanks[i] = new Uint8Array(0x0800);
        }

        this._setupRom();

        this.reset();
    }

    reset() {
        this._setBankswitchMode(0);
        this._transitionCount = 0;
        this._pendingWrite = false;
        this._pendingWriteData = 0;
        this._lastAddressBusValue = -1;
        this._writeRamEnabled = false;
        this._loadInProgress = false;
        this._loadTimestamp = 0;
    }

    setBus(bus: Bus): this {
        this._bus = bus;

        this._bus.event.read.addHandler(CartridgeSupercharger._onBusAccess, this);
        this._bus.event.write.addHandler(CartridgeSupercharger._onBusAccess, this);

        return this;
    }

    setCpuTimeProvider(provider: () => number): this {
        this._cpuTimeProvider = provider;

        return this;
    }

    setRng(rng: RngInterface): this {
        this._rng = rng;

        return this;
    }

    read(address: number): number {
        return this._access(address, this._bus.getLastDataBusValue());
    }

    peek(address: number): number {
        address &= 0x0fff;

        return address < 0x0800 ? this._bank0[address] : this._bank1[address & 0x07ff];
    }

    write(address: number, value: number): void {
        this._access(address, value);
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_supercharger;
    }

    private static _onBusAccess(type: Bus.AccessType, self: CartridgeSupercharger) {
        const address = self._bus.getLastAddresBusValue();

        if (address !== self._lastAddressBusValue) {
            if (++self._transitionCount > 5) {
                self._pendingWrite = false;
            }

            self._lastAddressBusValue = address;
        }
    }

    private _access(address: number, value: number): number {
        address &= 0x0fff;

        if (this._loadInProgress) {
            if ((this._cpuTimeProvider() - this._loadTimestamp) > 1E-3) {
                this._loadInProgress = false;
            } else {
                return value;
            }
        }

        const readValue = address < 0x0800 ? this._bank0[address] : this._bank1[address & 0x07ff];

        if ((address & 0x0f00) === 0 && (!this._pendingWrite || !this._writeRamEnabled)) {
            this._pendingWriteData = address & 0x00ff;
            this._transitionCount = 0;
            this._pendingWrite = this._writeRamEnabled;

            return readValue;
        }

        if (address === 0x0ff8) {
            this._setBankswitchMode((this._pendingWriteData & 28) >>> 2);
            this._writeRamEnabled = (this._pendingWriteData & 0x02) > 0;

            this._pendingWrite = false;

            return readValue;
        }

        if (address === 0x0ff9 && this._bank1Type === BankType.rom && ((this._lastAddressBusValue & 0x1fff) < 0xff)) {
            this._loadIntoRam(value);

            return readValue;
        }

        if (this._pendingWrite && this._writeRamEnabled && this._transitionCount === 5) {
            this._pendingWrite = false;

            if (address < 0x0800) {
                this._bank0[address] = this._pendingWriteData;
            } else if (this._bank1Type === BankType.ram) {
                this._bank1[address & 0x07ff] = this._pendingWriteData;
            } else {
                return readValue;
            }

            return this._pendingWriteData;
        }

        return readValue;
    }

    private _setBankswitchMode(mode: number): void {
        switch (mode) {
            case 0:
                return this._configureBanks(2, BankType.rom);

            case 1:
                return this._configureBanks(0, BankType.rom);

            case 2:
                return this._configureBanks(2, BankType.ram, 0);

            case 3:
                return this._configureBanks(0, BankType.ram, 2);

            case 4:
                return this._configureBanks(2, BankType.rom);

            case 5:
                return this._configureBanks(1, BankType.rom);

            case 6:
                return this._configureBanks(2, BankType.ram, 1);

            case 7:
                return this._configureBanks(1, BankType.ram, 2);

            default:
                throw new Error('invalid bankswitching mode');
        }
    }

    private _configureBanks(bank0: number, bank1Type: BankType, bank1 = 0): void {
        this._bank0 = this._ramBanks[bank0];
        this._bank1Type = bank1Type;
        this._bank1 = bank1Type === BankType.ram ? this._ramBanks[bank1] : this._rom;
    }

    private _setupRom() {
        for (let i = 0; i < 0x0800; i++) {
            this._rom[i] = 0;
        }

        for (let i = 0; i < bios.length; i++) {
            this._rom[i] = bios[i];
        }

        this._rom[0x07ff] = this._rom[0x07fd] = 0xf8;
        this._rom[0x07fe] = this._rom[0x07fc] = 0x07;
    }

    private _loadIntoRam(loadId: number) {
        let loadIndex: number;

        for (loadIndex = 0; loadIndex < this._loadCount; loadIndex++) {
            if (this._headers[loadIndex].multiloadId === loadId || this._loadCount === 1) {
                break;
            }
        }

        if (loadIndex >= this._loadCount) {
            console.log(`no load with id ${loadId}`);
        }

        const header = this._headers[loadIndex],
            load = this._loads[loadIndex];

        for (let blockIdx = 0; blockIdx < header.blockCount; blockIdx++) {
            const location = header.blockLocation[blockIdx];

            let bank = location & 0x03;

            if (bank > 2) {
                bank = 0;
                console.log(`invalid bank for block ${blockIdx}, load ${loadIndex}`);
            }

            const base = ((location & 28) >>> 2) * 256;
            let checksum = location + header.blockChecksum[blockIdx];

            for (let i = 0; i < 256; i++) {
                checksum += load[256 * blockIdx + i];
                this._ramBanks[bank][base + i] = load[256 * blockIdx + i];
            }

            if ((checksum & 0xff) !== 0x55) {
                console.log(`load ${loadIndex}, block ${blockIdx}: invalid checksum`);
            }
        }

        this._rom[0x7f0] = header.controlWord;
        this._rom[0x7f1] = this._rng.int(0xff);
        this._rom[0x7f2] = header.startAddressLow;
        this._rom[0x7f3] = header.startAddressHigh;

        this._loadInProgress = true;
        this._loadTimestamp = this._cpuTimeProvider();
    }

    private _bus: Bus;

    private _loadCount = 0;
    private _loads: Array<Uint8Array> = null;
    private _headers: Array<Header> = null;

    private _rom = new Uint8Array(0x800);
    private _ramBanks = new Array<Uint8Array>(3);

    private _bank0: Uint8Array = null;
    private _bank1: Uint8Array = null;
    private _bank1Type = BankType.rom;

    private _transitionCount = 0;
    private _pendingWriteData = 0;
    private _pendingWrite = false;
    private _lastAddressBusValue = -1;
    private _writeRamEnabled = false;
    private _loadInProgress = false;
    private _loadTimestamp = 0;

    private _rng: RngInterface;
    private _cpuTimeProvider: () => number = null;
}

export { CartridgeSupercharger as default };
