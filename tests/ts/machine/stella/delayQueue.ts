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
