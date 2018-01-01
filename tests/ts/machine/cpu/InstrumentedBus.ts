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

import BusInterface from '../../../../src/machine/bus/BusInterface';
import AccessLog from './AccessLog';

class InstrumentedBus implements BusInterface {
    readWord(address: number): number {
        return this.read(address) | (this.read((address + 1) & 0xffff) << 8);
    }

    read(address: number): number {
        this._accessLog.read(address);

        return this._memory[address];
    }

    write(address: number, value: number): void {
        this._accessLog.write(address);

        this._memory[address] = value;
    }

    peek(address: number): number {
        return this.read(address);
    }

    poke(address: number, value: number): void {
        return this.write(address, value);
    }

    getLog(): AccessLog {
        return this._accessLog;
    }

    private _accessLog = new AccessLog();
    private _memory = new Uint8Array(0x10000);
}

export { InstrumentedBus as default };
