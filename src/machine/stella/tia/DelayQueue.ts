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

class DelayQueue {
    constructor(private _length: number, size: number) {
        this._queue = new Array<QueueEntry>(this._length);

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
            this._indices[entry.addresses[i]] = 0xff;
        }

        entry.nextIndex = 0;
    }

    private _queue: Array<QueueEntry>;
    private _nextIndex = 0;
    private _indices = new Uint8Array(0xff);
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

export { DelayQueue as default };
