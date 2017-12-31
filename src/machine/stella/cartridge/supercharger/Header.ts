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

class Header {
    constructor(buffer: { [idx: number]: number; length: number }) {
        this.startAddressLow = buffer[0x2000];
        this.startAddressHigh = buffer[0x2001];
        this.controlWord = buffer[0x2002];
        this.blockCount = buffer[0x2003];
        this.checksum = buffer[0x2004];
        this.multiloadId = buffer[0x2005];
        this.progressBarSpeedLow = buffer[0x2006];
        this.progressBarSpeedHigh = buffer[0x2007];

        this.blockLocation = new Uint8Array(this.blockCount);
        this.blockChecksum = new Uint8Array(this.blockCount);

        for (let i = 0; i < this.blockCount; i++) {
            this.blockLocation[i] = buffer[0x2000 + 16 + i];
            this.blockChecksum[i] = buffer[0x2000 + 64 + i];
        }
    }

    verify(): boolean {
        const checksum =
            this.startAddressLow +
            this.startAddressHigh +
            this.controlWord +
            this.blockCount +
            this.checksum +
            this.multiloadId +
            this.progressBarSpeedLow +
            this.progressBarSpeedHigh;

        return (checksum & 0xff) === 0x55;
    }

    startAddressLow: number;
    startAddressHigh: number;
    controlWord: number;
    blockCount: number;
    checksum: number;
    multiloadId: number;
    progressBarSpeedLow: number;
    progressBarSpeedHigh: number;

    blockLocation: Uint8Array = null;
    blockChecksum: Uint8Array = null;
}

export default Header;
