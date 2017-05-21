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

class DelayQueue {

    constructor(private _length: number, size: number) {
        this._queue  = new Array<QueueEntry>(this._length);

        for (let i = 0; i < this._length; i++) {
            this._queue[i] = new QueueEntry(size);
        }
    }

    reset() {
        for (let i = 0; i < this._length; i++) {
            this._queue[i].nextIndex = 0;
        }
    }

    push(address: number, value: number, delay: number): this {
        if (delay >= this._length) {
            throw new Error('delay exceeds queue length');
        }

        const currentIndex = this._indices[address];

        if (currentIndex < this._length) {
            this._queue[currentIndex].remove(address);
        }

        const index = (this._nextIndex + delay) % this._length;
        this._queue[index].push(address, value);

        this._indices[address] = index;

        return this;
    }

    execute<T>(handler: (address: number, value: number, scope: T) => void, scope?: T): void {
        const entry = this._queue[this._nextIndex];
        this._nextIndex = (this._nextIndex + 1) % this._length;

        for (let i = 0; i < entry.nextIndex; i++) {
            handler(entry.addresses[i], entry.values[i], scope);
            this._indices[entry.addresses[i]] = 0xFF;
        }

        entry.nextIndex = 0;
    }

    private _queue: Array<QueueEntry>;
    private _nextIndex = 0;
    private _indices = new Uint8Array(0xFF);

}

class QueueEntry {

    constructor(public size: number) {
        this.addresses = new Uint8Array(size);
        this.values = new Uint8Array(size);
    }

    push(address: number, value: number): void {
        if (this.nextIndex >= this.size) {
            throw new Error('delay queue overflow');
        }

        this.addresses[this.nextIndex] = address;
        this.values[this.nextIndex] = value;

        this.nextIndex++;
    }

    remove(address: number): void {
        let i: number;

        for (i = 0; i < this.nextIndex; i++) {
            if (this.addresses[i] === address) {
                break;
            }
        }

        if (i < this.nextIndex) {
            this.addresses[i] = this.addresses[this.nextIndex - 1];
            this.values[i] = this.values[this.nextIndex - 1];
            this.nextIndex--;
        }
    }

    addresses: Uint8Array;
    values: Uint8Array;
    nextIndex = 0;

}

export default DelayQueue;
