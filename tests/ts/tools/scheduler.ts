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

import * as assert from 'assert';
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
