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

import * as hex from '../../../../src/tools/hex';

const enum AccessType {
    read,
    write
}

class Entry {
    constructor(public type: AccessType, public address: number) {}

    equals(anotherEntry: Entry): boolean {
        return this.type === anotherEntry.type && this.address === anotherEntry.address;
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
            throw new Error(`access count differs: ${this._entries.length} vs. ${otherLog._entries.length}`);
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

export { AccessLog as default };
