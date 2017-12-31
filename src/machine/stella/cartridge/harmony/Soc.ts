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
import { Event } from 'microevent.ts';

import { encode as hex } from '../../../../tools/hex';

const enum CONST {
    returnAddress = 0x8004
}

function hostIsLittleEndian(): boolean {
    const buffer8 = new Uint8Array([1, 2, 3, 4]),
        buffer32 = new Uint32Array(buffer8.buffer);

    return buffer32[0] === 0x04030201;
}

class Soc {
    constructor(blx32Handler: Soc.Blx32Handler = () => Thumbulator.TrapReason.bxLeaveThumb) {
        if (hostIsLittleEndian()) {
            // If we are on a little endian host, we use typed arrays to take advantage of
            // hardware word access
            this.getRom16 = address => this._rom16[address >>> 1];
            this.getRom32 = address => this._rom32[address >>> 2];
            this.getRam16 = address => this._ram16[address >>> 1];
            this.getRam32 = address => this._ram32[address >>> 2];
            this.setRam16 = (address, value) => (this._ram16[address >>> 1] = value);
            this.setRam32 = (address, value) => (this._ram32[address >>> 2] = value);
        } else {
            // On big endian, we dance the endianness shuffle ourselves (DataView is dead slow)
            this.getRom16 = address => this._rom8[address] | (this._rom8[address + 1] << 8);
            this.getRom32 = address =>
                this._rom8[address] |
                (this._rom8[address + 1] << 8) |
                (this._rom8[address + 2] << 16) |
                (this._rom8[address + 3] << 24);
            this.getRam16 = address => this._ram8[address] | (this._ram8[address + 1] << 8);
            this.getRam32 = address =>
                this._ram8[address] |
                (this._ram8[address + 1] << 8) |
                (this._ram8[address + 2] << 16) |
                (this._ram8[address + 3] << 24);
            this.setRam16 = (address, value) => {
                this._ram8[address] = value & 0xff;
                this._ram8[address + 1] = (value >>> 8) & 0xff;
            };
            this.setRam32 = (address, value) => {
                this._ram8[address] = value & 0xff;
                this._ram8[address + 1] = (value >>> 8) & 0xff;
                this._ram8[address + 2] = (value >>> 16) & 0xff;
                this._ram8[address + 3] = (value >>> 24) & 0xff;
            };
        }

        // ARM ROM: the whole ROM image, suitable for 16bit and 32bit access
        this._rom8 = new Uint8Array(this._romBuffer);
        this._rom16 = new Uint16Array(this._romBuffer);
        this._rom32 = new Uint32Array(this._romBuffer);

        // ARM RAM
        this._ram8 = new Uint8Array(this._ramBuffer);
        this._ram16 = new Uint16Array(this._ramBuffer);
        this._ram32 = new Uint32Array(this._ramBuffer);

        this._thumbulator = new Thumbulator(this._thumbulatorBus, {
            stopAddress: CONST.returnAddress,
            trapOnBx32: blx32Handler
        });

        this.reset();
    }

    init(): Promise<void> {
        return this._thumbulator.init();
    }

    reset(): void {}

    getRom(): Uint8Array {
        return this._rom8;
    }

    getRam(): Uint8Array {
        return this._ram8;
    }

    run(entry: number): void {
        this._thumbulator.reset();
        this._thumbulator.enableDebug(false);

        for (let i = 0; i <= 12; i++) {
            this._thumbulator.writeRegister(i, 0);
        }

        this._thumbulator.writeRegister(13, 0x40001fb4);
        this._thumbulator.writeRegister(14, CONST.returnAddress + 1);
        this._thumbulator.writeRegister(15, entry);

        this._armMamcr = 0;

        const trap = this._thumbulator.run(500000);

        if (trap !== Thumbulator.TrapReason.stop && trap !== Thumbulator.TrapReason.abort) {
            this._triggerTrap(`ARM execution trapped: ${trap}`);
        }
    }

    getThumbulator(): Thumbulator {
        return this._thumbulator;
    }

    private _triggerTrap(message: string): void {
        this._thumbulator.abort();
        this.trap.dispatch(message);
    }

    getRom16: (address: number) => number;
    getRom32: (address: number) => number;
    getRam16: (address: number) => number;
    getRam32: (address: number) => number;
    setRam16: (address: number, value: number) => void;
    setRam32: (address: number, value: number) => void;

    trap = new Event<string>();

    private _thumbulatorBus: Thumbulator.Bus = {
        read16: (address: number): number => {
            if (address & 0x01) {
                this._triggerTrap(`unaligned 16 bit ARM read from ${hex(address, 8, false)}`);
                return 0;
            }

            const region = address >>> 28,
                addr = address & 0x0fffffff;

            switch (region) {
                case 0x0:
                    if (addr < 0x8000) {
                        return this.getRom16(addr);
                    }
                    break;

                case 0x4:
                    if (addr < 0x2000) {
                        return this.getRam16(addr);
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

            this._triggerTrap(`invalid 16 bit ARM read from ${hex(address, 8, false)}`);
        },

        read32: (address: number): number => {
            if (address & 0x03) {
                this._triggerTrap(`unaligned 32 bit ARM read from ${hex(address, 8, false)}`);
                return 0;
            }

            const region = address >>> 28,
                addr = address & 0x0fffffff;

            switch (region) {
                case 0x0:
                    if (addr < 0x8000) {
                        return this.getRom32(addr);
                    }
                    break;

                case 0x4:
                    if (addr < 0x2000) {
                        return this.getRam32(addr);
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

            this._triggerTrap(`invalid 32 bit ARM read from ${hex(address, 8, false)}`);
        },

        write16: (address: number, value: number): void => {
            if (address & 0x01) {
                this._triggerTrap(`unaligned 16 bit ARM write: ${hex(value, 4)} -> ${hex(address, 8, false)}`);
                return;
            }

            const region = address >>> 28,
                addr = address & 0x0fffffff;

            switch (region) {
                case 0x04:
                    if (addr < 0x2000) {
                        this.setRam16(addr, value & 0xffff);
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

            this._triggerTrap(`invalid 16 bit ARM write: ${hex(value, 4)} -> ${hex(address, 8, false)}`);
        },

        write32: (address: number, value: number): void => {
            if (address & 0x03) {
                this._triggerTrap(`unaligned 32 bit ARM write: ${hex(value, 8, false)} -> ${hex(address, 8, false)}`);
                return;
            }

            const region = address >>> 28,
                addr = address & 0x0fffffff;

            switch (region) {
                case 0x4:
                    if (addr < 0x2000) {
                        this.setRam32(addr, value);
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

            this._triggerTrap(`invalid 32 bit ARM write: ${hex(value, 8, false)} -> ${hex(address, 8, false)}`);
        }
    };

    private _romBuffer = new ArrayBuffer(0x8000);

    private _rom8: Uint8Array;
    private _rom16: Uint16Array;
    private _rom32: Uint32Array;

    private _ramBuffer = new ArrayBuffer(0x2000);

    private _ram8: Uint8Array;
    private _ram16: Uint16Array;
    private _ram32: Uint32Array;

    private _armMamcr = 0;

    private _thumbulator: Thumbulator = null;
}

namespace Soc {
    export interface Blx32Handler {
        (address: number, targetAddress: number): number;
    }
}

export default Soc;
