import * as assert from 'assert';
import * as util from 'util';

import Pool from '../../src/tools/pool/Pool';

let releaseCtr = 0,
    disposeCtr = 0;

class Probe {}

suite('Object Pool', function() {

    let pool: Pool<Probe>,
        factoryInvocations: number;

    setup(function() {
        factoryInvocations = 0;

        pool = new Pool(() => {
            factoryInvocations++;
            return new Probe();
        });

        releaseCtr = 0;
        disposeCtr = 0;

        pool.event.release.addHandler((value: Probe) => releaseCtr++);
        pool.event.dispose.addHandler((value: Probe) => disposeCtr++);
    });

    function assertCallCount(factoryReference: number, releaseReference: number, disposeReference: number) {
        assert.equal(factoryReference, factoryInvocations, util.format(
            'factory should have been called %s times, was called %s times', factoryReference, factoryInvocations));

        assert.equal(releaseReference, releaseCtr, util.format(
            'release should have been called %s times, was called %s times', releaseReference, releaseCtr));

        assert.equal(disposeReference, disposeCtr, util.format(
            'dispose should have been called %s times, was called %s times', disposeReference, disposeCtr));
    }

    test('get - get', function() {
        const p1 = pool.get(),
            p2 = pool.get();

        assert(p1.get() !== p2.get(), 'pool should have returned different instances');
        assertCallCount(2, 0, 0);
    });

    test('get - release - get', function() {
        const p1 = pool.get();

        p1.release();

        let p2 = pool.get();

        assert(p1.get() === p2.get(), 'pool should have returned identical instances');
        assertCallCount(1, 1, 0);
    });

    test('get - dispose - get', function() {
        const p1 = pool.get();

        p1.dispose();

        const p2 = pool.get();

        assert(p1.get() !== p2.get(), 'pool should have returned a new instance');
        assertCallCount(2, 0, 1);
    });

    test('get - get - release - release - dispose - get - get', function() {
        const p1 = pool.get(),
            p2 = pool.get();

        p2.release();
        p1.release();

        p2.dispose();

        const p3 = pool.get(),
            p4 = pool.get();

        assert(p1.get() === p3.get(), 'pool should have reused the first instance');
        assert(p2.get() !== p4.get(), 'pool should not have reused the second instance');

        assertCallCount(3, 2, 1);
    });

    test('double dispose should throw', function() {
        const p1 = pool.get();

        p1.dispose();

        assert.throws(() => p1.dispose(), 'second dispose should throw');
    });

    test('double release should throw', function() {
        const p1 = pool.get();

        p1.release();

        assert.throws(() => p1.release(), 'second release should throw');
    });

    test('releasing an already disposed instance should throw', function() {
        const p1 = pool.get();

        p1.dispose();

        assert.throws(() => p1.release(), 'release should throw');
    });
});
