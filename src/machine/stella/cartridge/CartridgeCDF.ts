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

import Thumbulator from 'thumbulator.ts';

import HarmonySoc from './harmony/Soc';
import AbstractCartridge from './AbstractCartridge';
import CartridgeInfo from './CartridgeInfo';
import Bus from '../Bus';
import CartridgeInterface from './CartridgeInterface';
import * as cartridgeUtil from './util';

const enum ReservedStream {
    amplitudeCDF = 0x22,
    amplitudeCDFJ = 0x23,
    jump = 0x21,
    comm = 0x20
}

const enum CdfVersion {
    cdf0,
    cdf1,
    cdfj,
    invalid
}

class CartridgeCDF extends AbstractCartridge {
    constructor(buffer: cartridgeUtil.BufferInterface) {
        super();

        const version = CartridgeCDF.getVersion(buffer);

        switch (version) {
            case CdfVersion.cdf0:
                this._jumpstreamMask = 0xff;
                this._amplitudeStream = ReservedStream.amplitudeCDF;
                this._datastreamBase = 0x06e0;
                this._datastreamIncrementBase = 0x0768;
                this._waveformBase = 0x7f0;
                break;

            case CdfVersion.cdf1:
                this._jumpstreamMask = 0xff;
                this._amplitudeStream = ReservedStream.amplitudeCDF;
                this._datastreamBase = 0x00a0;
                this._datastreamIncrementBase = 0x0128;
                this._waveformBase = 0x01b0;
                break;

            case CdfVersion.cdfj:
                this._jumpstreamMask = 0xfe;
                this._amplitudeStream = ReservedStream.amplitudeCDFJ;
                this._datastreamBase = 0x0098;
                this._datastreamIncrementBase = 0x0124;
                this._waveformBase = 0x01b0;
                break;

            default:
                throw new Error('not a CDF image: missing signature');
        }

        if (buffer.length !== 0x8000) {
            throw new Error(`not a CDF image: invalid lenght ${buffer.length}`);
        }

        this._soc = new HarmonySoc(version === CdfVersion.cdf0 ? this._handleBxCDF0 : this._handleBxCDF1);
        this._soc.trap.addHandler(message => this.triggerTrap(CartridgeInterface.TrapReason.other, message));

        /* ROM layout:
         *
         *    2k ARM driver
         *    2k user ARM code
         *    28k 6502 ROM
         */

        this._rom = this._soc.getRom();

        for (let i = 0; i < 0x8000; i++) {
            this._rom[i] = buffer[i];
        }

        for (let i = 0; i < 7; i++) {
            this._banks[i] = new Uint8Array(this._rom.buffer, 0x1000 * (i + 1), 0x1000);
        }

        /* RAM layout
         *
         *    * 2k driver (copied to RAM)
         *    * 4k display RAM
         *    * 2k aux RAM
         */

        this._ram = this._soc.getRam();
        this._displayRam = new Uint8Array(this._soc.getRam().buffer, 0x0800, 0x1000);

        for (let i = 0; i < 3; i++) {
            this._musicStreams[i] = new MusicStream();
        }

        this.reset();
    }

    static getVersion(buffer: cartridgeUtil.BufferInterface): CdfVersion {
        const sig = 'CDF'.split('').map(x => x.charCodeAt(0)),
            startAddress = cartridgeUtil.searchForSignature(buffer, [...sig, -1, ...sig, -1, ...sig]);

        if (startAddress < 0) {
            return null;
        }

        switch (buffer[startAddress + 3]) {
            case 0:
                return CdfVersion.cdf0;

            case 1:
                return CdfVersion.cdf1;

            case 'J'.charCodeAt(0):
                return CdfVersion.cdfj;

            default:
                return CdfVersion.invalid;
        }
    }

    static matchesBuffer(buffer: cartridgeUtil.BufferInterface): boolean {
        return CartridgeCDF.getVersion(buffer) !== CdfVersion.invalid;
    }

    init(): Promise<void> {
        return this._soc.init();
    }

    reset() {
        for (let i = 0; i < 0x0200; i++) {
            this._soc.setRam32(i << 2, this._soc.getRom32(i << 2));
        }

        this._fastFetch = false;
        this._digitalAudio = false;

        this._fastJumpCountdown = 0;
        this._fastFetchPending = false;

        this._jmpOperandAddress = 0;
        this._ldaOperandAddress = 0;

        this._currentBank = this._banks[6];

        for (let i = 0; i < 3; i++) {
            this._musicStreams[i].reset();
        }

        this._lastCpuTime = 0;
        this._clockAccumulator = 0;
    }

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.bankswitch_cdf;
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

    private _access(address: number, value: number): number {
        address &= 0x0fff;

        const romValue = this._currentBank[address];

        if (this._fastJumpCountdown-- > 0 && address === this._jmpOperandAddress) {
            this._jmpOperandAddress++;

            return this._datastreamReadWithIncrement(this._jumpstream, 0x0100);
        }

        if (
            this._fastFetch &&
            romValue === 0x4c &&
            (this._currentBank[(address + 1) & 0x0fff] & this._jumpstreamMask) === 0 &&
            this._currentBank[(address + 2) & 0x0fff] === 0
        ) {
            this._fastJumpCountdown = 2;
            this._jmpOperandAddress = (address + 1) & 0x0fff;
            this._jumpstream = ReservedStream.jump + this._currentBank[(address + 1) & 0x0fff];

            return romValue;
        }

        this._fastJumpCountdown = 0;

        if (
            this._fastFetch &&
            this._fastFetchPending &&
            this._ldaOperandAddress === address &&
            romValue <= this._amplitudeStream
        ) {
            this._fastFetchPending = false;

            if (romValue === this._amplitudeStream) {
                this._clockMusicStreams();

                if (this._digitalAudio) {
                    const counter = this._musicStreams[0].counter,
                        sampleAddress = this._soc.getRam32(this._waveformBase) + (counter >>> 21);

                    let sample = 0;

                    if (sampleAddress < 0x8000) {
                        sample = this._rom[sampleAddress];
                    }

                    if (sampleAddress > 0x40000000 && sampleAddress < 0x40002000) {
                        sample = this._ram[sampleAddress - 0x40000000];
                    }

                    if ((counter & 0x100000) === 0) {
                        sample >>>= 4;
                    }

                    return sample & 0x0f;
                } else {
                    let acc = 0;
                    for (let i = 0; i < 3; i++) {
                        acc += this._displayRam[
                            (this._getWaveform(i) +
                                (this._musicStreams[i].counter >>> this._musicStreams[i].waveformSize)) &
                                0x0fff
                        ];
                    }

                    return acc;
                }
            }

            return this._datastreamRead(romValue);
        }

        this._fastFetchPending = false;

        if (address >= 0x0ff0) {
            switch (address) {
                case 0x0ff0:
                    this._datastreamWriteWithIncrement(ReservedStream.comm, value, 0x0100);
                    break;

                case 0x0ff1: {
                    let pointer = this._getDatastreamPointer(ReservedStream.comm);
                    pointer <<= 8;
                    pointer &= 0xf0000000;
                    pointer |= value << 20;
                    this._setDatastreamPointer(ReservedStream.comm, pointer);

                    break;
                }

                case 0x0ff2:
                    this._fastFetch = (value & 0x0f) === 0;
                    this._digitalAudio = (value & 0xf0) === 0;
                    break;

                case 0x0ff3:
                    switch (value) {
                        case 254:
                        case 255:
                            this._soc.run(0x080b);
                            break;
                    }
                    break;
            }

            if (address > 0x0ff4 && address < 0x0ffc) {
                this._currentBank = this._banks[address - 0x0ff5];
            }
        }

        if (this._fastFetch && romValue === 0xa9) {
            this._fastFetchPending = true;
            this._ldaOperandAddress = (address + 1) & 0x0fff;
        }

        return romValue;
    }

    private _clockMusicStreams(): void {
        const cpuTime = this._cpuTimeProvider();

        this._clockAccumulator += (cpuTime - this._lastCpuTime) * 20000;
        this._lastCpuTime = cpuTime;

        const clocks = Math.floor(this._clockAccumulator);
        this._clockAccumulator -= clocks;

        if (clocks === 0) {
            return;
        }

        for (let i = 0; i < 3; i++) {
            this._musicStreams[i].increment(clocks);
        }
    }

    private _getDatastreamPointer(stream: number): number {
        return this._soc.getRam32(this._datastreamBase + 4 * stream);
    }

    private _setDatastreamPointer(stream: number, value: number): void {
        this._soc.setRam32(this._datastreamBase + 4 * stream, value);
    }

    private _getDatastreamIncrement(stream: number): number {
        return this._soc.getRam32(this._datastreamIncrementBase + 4 * stream);
    }

    private _datastreamRead(stream: number): number {
        const pointer = this._getDatastreamPointer(stream),
            value = this._displayRam[pointer >>> 20];

        this._setDatastreamPointer(stream, (pointer + (this._getDatastreamIncrement(stream) << 12)) | 0);

        return value;
    }

    private _datastreamReadWithIncrement(stream: number, increment: number): number {
        const pointer = this._getDatastreamPointer(stream),
            value = this._displayRam[pointer >>> 20];

        this._setDatastreamPointer(stream, (pointer + (increment << 12)) | 0);

        return value;
    }

    private _datastreamWriteWithIncrement(stream: number, value: number, increment: number) {
        const pointer = this._getDatastreamPointer(stream);

        this._displayRam[pointer >>> 20] = value;

        this._setDatastreamPointer(stream, (pointer + (increment << 12)) | 0);
    }

    private _getWaveform(index: number): number {
        const value = this._soc.getRam32(this._waveformBase + 4 * index);

        return (value - 0x40000000 - 0x0800) & 0x0fff;
    }

    private _handleBxCDF0 = (address: number): number => {
        const thumbulator = this._soc.getThumbulator(),
            r2 = thumbulator.readRegister(2),
            r3 = thumbulator.readRegister(3);

        switch (address) {
            case 0x000006e2:
                this._musicStreams[r2 % 3].frequency = r3;
                return 0;

            case 0x000006e6:
                this._musicStreams[r2 % 3].counter = 0;
                return 0;

            case 0x000006ea:
                thumbulator.writeRegister(2, this._musicStreams[r2 % 3].counter);
                return 0;

            case 0x000006ee:
                this._musicStreams[r2 % 3].waveformSize = r3;
                return 0;
        }

        return Thumbulator.TrapReason.bxLeaveThumb;
    };

    private _handleBxCDF1 = (address: number): number => {
        const thumbulator = this._soc.getThumbulator(),
            r2 = thumbulator.readRegister(2),
            r3 = thumbulator.readRegister(3);

        switch (address) {
            case 0x00000752:
                this._musicStreams[r2 % 3].frequency = r3;
                return 0;

            case 0x00000756:
                this._musicStreams[r2 % 3].counter = 0;
                return 0;

            case 0x0000075a:
                thumbulator.writeRegister(2, this._musicStreams[r2 % 3].counter);
                return 0;

            case 0x0000075e:
                this._musicStreams[r2 % 3].waveformSize = r3;
                return 0;
        }

        return Thumbulator.TrapReason.bxLeaveThumb;
    };

    private _banks = new Array<Uint8Array>(7);
    private _currentBank: Uint8Array = null;

    private _rom: Uint8Array = null;
    private _ram: Uint8Array = null;
    private _displayRam: Uint8Array = null;

    private _musicStreams = new Array<MusicStream>(3);
    private _clockAccumulator = 0;
    private _lastCpuTime = 0;

    private _soc: HarmonySoc = null;

    private _fastFetch = false;
    private _digitalAudio = false;

    private _fastJumpCountdown = 0;
    private _fastFetchPending = false;

    private _jmpOperandAddress = 0;
    private _ldaOperandAddress = 0;

    private _datastreamBase = 0;
    private _datastreamIncrementBase = 0;
    private _waveformBase = 0;

    private _jumpstream = 0;
    private _jumpstreamMask = 0;
    private _amplitudeStream = 0;

    private _bus: Bus = null;
    private _cpuTimeProvider: () => number = null;
}

class MusicStream {
    reset() {
        this.counter = this.frequency = 0;
        this.waveformSize = 27;
    }

    increment(clocks: number): void {
        this.counter = (this.counter + clocks * this.frequency) | 0;
    }

    counter = 0;
    frequency = 0;
    waveformSize = 27;
}

export { CartridgeCDF as default };
