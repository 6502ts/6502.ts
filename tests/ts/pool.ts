///<reference path="./interface/mocha.d.ts"/>
///<reference path="../../typings/node/node.d.ts"/>

import assert = require('assert');
import util = require('util');

import Pool = require('../../src/tools/pool/Pool');

var recycleCtr = 0,
    disposeCtr = 0;

class Probe {
    recycle(): void {
        recycleCtr++;
    }

    dispose(): void {
        disposeCtr++;
    }
}



suite('Object Pool', function() {

    var pool: Pool<Probe>,
        factoryInvocations: number;

    setup(function() {
        factoryInvocations = 0;
        recycleCtr = 0,
        disposeCtr = 0;

        pool = new Pool(() => {
            factoryInvocations++;
            return new Probe();
        });

        pool.event.recycle.addHandler((value: Probe) => value.recycle());
        pool.event.dispose.addHandler((value: Probe) => value.dispose());
    });

    function assertCallCount(factoryReference: number, recycleReference: number, disposeReference: number) {
        assert.equal(factoryReference, factoryInvocations, util.format(
            'factory should have been called %s times, was called %s times', factoryReference, factoryInvocations));

        assert.equal(recycleReference, recycleCtr, util.format(
            'recycle should have been called %s times, was called %s times', recycleReference, recycleCtr));
        
        assert.equal(disposeReference, disposeCtr, util.format(
            'dispose should have been called %s times, was called %s times', disposeReference, disposeCtr));
    }

    test('get - get', function() {
        var p1 = pool.get(),
            p2 = pool.get();

        assert(p1.get() !== p2.get(), 'pool should have returned different instances');
        assertCallCount(2, 0, 0);
    });

    test('get - recycle - get', function() {
        var p1 = pool.get();

        p1.recycle();

        var p2 = pool.get();

        assert (p1.get() === p2.get(), 'pool should have returned identical instances');
        assertCallCount(1, 1, 0);
    });

    test('get - dispose - get', function() {
        var p1 = pool.get();
        
        p1.dispose();

        var p2 = pool.get();

        assert(p1.get() !== p2.get(), 'pool should have returned a new instance');
        assertCallCount(2, 0, 1);
    });

    test('get - get - recycle - recycle - dispose - get - get', function() {
        var p1 = pool.get(),
            p2 = pool.get();

        p2.recycle();
        p1.recycle();

        p2.dispose();

        var p3 = pool.get(),
            p4 = pool.get();

        assert(p1.get() === p3.get(), 'pool should have reused the first instance');
        assert(p2.get() !== p4.get(), 'pool should not have reused the second instance');

        assertCallCount(3, 2, 1);
    });

    test('double dispose should throw', function() {
        var p1 = pool.get();

        p1.dispose();

        assert.throws(() => p1.dispose(), 'second dispose should throw');
    });

    test('double recycle should throw', function() {
        var p1 = pool.get();

        p1.recycle();

        assert.throws(() => p1.recycle(), 'second recycle should throw');
    });

    test('recycling an already disposed instance should throw', function() {
        var p1 = pool.get();

        p1.dispose();

        assert.throws(() => p1.recycle(), 'recycle should throw');
    });
});
