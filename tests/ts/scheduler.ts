///<reference path="./interface/mocha.d.ts"/>
///<reference path="../../typings/node/node.d.ts"/>

import assert = require('assert');
import util = require('util');
import PeriodicScheduler = require('../../src/tools/scheduler/PeriodicScheduler');

suite('Periodic Scheduler', function() {

    function implementation(scheduler: PeriodicScheduler, callback: Mocha.ReadyCallback) {

    }

    test('Preset period', function(callback: Mocha.ReadyCallback) {
        var scheduler = new PeriodicScheduler(50);
        var counter = 0;

        assert.equal(scheduler.getPeriod(), 50, 'Perdiod schould be 50');

        var terminator = scheduler.start(() => counter++);

        setTimeout(terminator, 225);

        setTimeout(function() {
            try {
                assert.equal(counter, 4, util.format('Worker should have been called four times, was %s', counter));
            } catch (e) {
                return callback(e);
            }

            callback();
        }, 300);
    });

    test('Preset period', function(callback: Mocha.ReadyCallback) {
        var scheduler = new PeriodicScheduler(50);
        var counter = 0;

        assert.equal(scheduler.getPeriod(), 50, 'Perdiod schould be 50');

        var terminator = scheduler.start(() => {
            counter++;
            scheduler.setPeriod(scheduler.getPeriod() - 10);
        });

        setTimeout(terminator, 130);

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
