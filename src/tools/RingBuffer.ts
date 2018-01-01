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

class RingBuffer<T> {
    constructor(private _capacity: number) {
        this._buffer = new Array<T>(this._capacity);

        for (let i = 0; i < this._capacity; i++) {
            this._buffer[i] = null;
        }
    }

    size(): number {
        return this._size;
    }

    pop(): T {
        if (this._size === 0) {
            return undefined;
        }

        const item = this._buffer[this._index];
        this._buffer[this._index] = null;

        this._index = (this._index + 1) % this._capacity;
        this._size--;

        return item;
    }

    push(item: T): this {
        if (this._size === this._capacity) {
            this.pop();
        }

        this._buffer[(this._index + this._size++) % this._capacity] = item;

        return this;
    }

    forEach(fn: (item: T) => void): this {
        for (let i = 0; i < this._size; i++) {
            fn(this._buffer[(this._index + i) % this._capacity]);
        }

        return this;
    }

    clear(): this {
        for (let i = 0; i < this._capacity; i++) {
            this._buffer[i] = null;
        }

        this._size = 0;
        this._index = 0;

        return this;
    }

    private _size = 0;
    private _index = 0;
    private _buffer: Array<T>;
}

export { RingBuffer as default };
