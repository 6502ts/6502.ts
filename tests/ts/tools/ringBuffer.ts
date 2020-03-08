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

import assert from 'assert';
import RingBuffer from '../../../src/tools/RingBuffer';

function getContent<T>(buffer: RingBuffer<T>): Array<T> {
    const result: Array<T> = [];

    buffer.forEach(x => result.push(x));

    return result;
}

suite('Ring buffer', () => {
    let buffer: RingBuffer<number>;

    setup(() => (buffer = new RingBuffer<number>(4)));

    test('empty buffer is ...err ...empty', () => {
        assert.strictEqual(buffer.size(), 0);
        assert.deepEqual(getContent(buffer), []);
        assert.strictEqual(buffer.pop(), undefined);
    });

    test('push adds items', () => {
        buffer.push(1).push(2);

        assert.strictEqual(buffer.size(), 2);
        assert.deepEqual(getContent(buffer), [1, 2]);
    });

    test('items are pushed out from the start', () => {
        buffer
            .push(1)
            .push(2)
            .push(3)
            .push(4)
            .push(5);

        assert.strictEqual(buffer.size(), 4);
        assert.deepEqual(getContent(buffer), [2, 3, 4, 5]);
    });

    test('pop removes items', () => {
        buffer
            .push(1)
            .push(2)
            .push(3);

        assert.strictEqual(buffer.pop(), 1);
        assert.strictEqual(buffer.size(), 2);
        assert.deepEqual(getContent(buffer), [2, 3]);

        buffer.push(4).push(5);
        assert.strictEqual(buffer.size(), 4);
        assert.deepEqual(getContent(buffer), [2, 3, 4, 5]);

        assert.strictEqual(buffer.pop(), 2);
        assert.strictEqual(buffer.size(), 3);
        assert.deepEqual(getContent(buffer), [3, 4, 5]);
    });

    test('evict is dispatched if an overflow happens', () => {
        let calls = 0;
        buffer.evict.addHandler(() => calls++);

        buffer
            .push(1)
            .push(2)
            .push(3)
            .push(4)
            .push(5);

        assert.strictEqual(calls, 1);
    });

    test('clear wipes the buffer', () => {
        buffer
            .push(1)
            .push(2)
            .push(3);

        buffer.clear();

        assert.strictEqual(buffer.size(), 0);
        assert.deepEqual(getContent(buffer), []);

        buffer
            .push(1)
            .push(2)
            .push(3);
        assert.strictEqual(buffer.size(), 3);
        assert.deepEqual(getContent(buffer), [1, 2, 3]);
    });
});
