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

import * as hex from '../../../../src/tools/hex';

const enum AccessType {read, write};

class Entry {

    constructor(
        public type: AccessType,
        public address: number
    ) {}

    equals(anotherEntry: Entry): boolean {
        return (this.type === anotherEntry.type) && (this.address === anotherEntry.address);
    }

    toString(): string {
        return `${this.type === AccessType.read ? 'read' : 'write'} @ ${hex.encode(this.address, 4)}`;
    }

}

class AccessLog {

    static create() {
        return new AccessLog();
    }

    read(address: number): this {
        this._entries.push(new Entry(AccessType.read, address));

        return this;
    }

    write(address: number): this {
        this._entries.push(new Entry(AccessType.write, address));

        return this;
    }

    assertEqual(otherLog: AccessLog): this {
        if (this._entries.length !== otherLog._entries.length) {
            throw new Error(
                `access count differs: ${this._entries.length} vs. ${otherLog._entries.length}`
            );
        }

        for (let i = 0; i < this._entries.length; i++) {
            if (!this._entries[i].equals(otherLog._entries[i])) {
                throw new Error(
                    `access ${i} differs: ${this._entries[i].toString()} vs ${otherLog._entries[i].toString()}`
                );
            }
        }

        return this;
    }

    clear(): void {
        this._entries = new Array<Entry>();
    }

    private _entries = new Array<Entry>();

}

export default AccessLog;