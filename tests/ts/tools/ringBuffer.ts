/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2015 - 2017  Christian Speckner & contributors
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

import * as assert from 'assert';
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
