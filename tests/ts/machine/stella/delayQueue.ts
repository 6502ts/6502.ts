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

import * as assert from 'assert';

import DelayQueue from '../../../../src/machine/stella/tia/DelayQueue';

interface WriteLog {
    [address: number]: Array<number>;
}

function logWrite(address: number, value: number, log: WriteLog) {
    if (!log[address]) {
        log[address] = new Array<number>();
    }

    log[address].push(value);
}

function logger(log: WriteLog): (address: number, value: number) => void {
    return (address: number, value: number) => logWrite(address, value, log);
}

suite('TIA: write delay queue', function() {
    let delayQueue: DelayQueue, writes: WriteLog;

    setup(function() {
        delayQueue = new DelayQueue(3, 3);
        writes = {};
    });

    suite('Writes are delayed', function() {
        test('zero cycles', function() {
            delayQueue.push(1, 2, 0);

            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, { 1: [2] });
        });

        test('one cycle', function() {
            delayQueue.push(1, 2, 1);

            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, { 1: [2] });
        });

        test('two cycles', function() {
            delayQueue.push(1, 2, 2);

            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, { 1: [2] });
        });

        test('two cycles, two cycles shift', function() {
            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.push(1, 2, 2);

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, { 1: [2] });
        });
    });

    test('writes are executed just once', function() {
        delayQueue.push(1, 2, 1);
        assert.deepEqual(writes, {});

        delayQueue.execute(logger(writes));
        assert.deepEqual(writes, {});

        delayQueue.execute(logger(writes));
        assert.deepEqual(writes, { 1: [2] });

        for (let i = 0; i < 10; i++) {
            delayQueue.execute(logger(writes));
        }

        delayQueue.execute(logger(writes));
        assert.deepEqual(writes, { 1: [2] });
    });

    suite('rescheduling clears any pending writes', function() {
        test('no other writes', function() {
            delayQueue.push(1, 2, 1);
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.push(1, 2, 1);
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, { 1: [2] });
        });

        test('one other write', function() {
            delayQueue.push(1, 2, 1).push(2, 1, 1);
            assert.deepEqual(writes, {});

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {});

            delayQueue.push(1, 2, 1);
            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, { 2: [1] });

            delayQueue.execute(logger(writes));
            assert.deepEqual(writes, {
                1: [2],
                2: [1]
            });
        });
    });

    test('exhausting queue depth throws', function() {
        assert.throws(() => delayQueue.push(1, 2, 4));
    });

    test('exhausting cycle queue throws', function() {
        assert.throws(() =>
            delayQueue
                .push(1, 1, 1)
                .push(2, 1, 1)
                .push(3, 1, 1)
                .push(5, 1, 1)
        );
    });
});
