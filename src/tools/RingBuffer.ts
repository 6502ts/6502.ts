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

    capacity(): number {
        return this._capacity;
    }

    private _size = 0;
    private _index = 0;
    private _buffer: Array<T>;
}

export { RingBuffer as default };
