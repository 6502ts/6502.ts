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
import * as util from 'util';
import PeriodicScheduler from '../../../src/tools/scheduler/PeriodicScheduler';

suite('Periodic Scheduler', function() {
    test('Preset period', function(callback: (e?: any) => void) {
        const scheduler = new PeriodicScheduler(50);
        let counter = 0,
            ctx = 0;

        function handler(context: number) {
            counter++;
            ctx = context;
        }

        assert.equal(scheduler.getPeriod(), 50, 'Perdiod schould be 50');

        const task = scheduler.start(handler, 50);

        setTimeout(() => task.stop(), 225);

        setTimeout(function() {
            try {
                assert.equal(counter, 4, util.format('Worker should have been called four times, was %s', counter));
                assert.equal(ctx, 50, 'Context was not transmitted correctly');
            } catch (e) {
                return callback(e);
            }

            callback();
        }, 300);
    });

    test('Preset period', function(callback: (e?: any) => void) {
        const scheduler = new PeriodicScheduler(50);
        let counter = 0;

        assert.equal(scheduler.getPeriod(), 50, 'Perdiod schould be 50');

        const task = scheduler.start(() => {
            counter++;
            scheduler.setPeriod(scheduler.getPeriod() - 10);
        });

        setTimeout(() => task.stop(), 130);

        setTimeout(function() {
            try {
                assert.equal(counter, 3, util.format('Worker should have been called three times, was %s', counter));
            } catch (e) {
                return callback(e);
            }

            callback();
        }, 200);
    });
});
