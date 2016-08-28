import * as assert from 'assert';

import Mutex from '../../../src/tools/Mutex';

suite('Mutex', function() {

    let mutex: Mutex;

    setup(() => mutex = new Mutex());

    test('ownership is exclusive', function() {
        let flag = false;

        mutex
            .acquire()
            .then(release => setTimeout(() => {
                flag = true;
                release();
            }, 50));

        return mutex.acquire()
            .then((release) => {
                release();

                assert(flag);
            });
    });

    test('runExclusive passes result (immediate)', function() {
        return mutex
            .runExclusive<number>(() => 10)
            .then(value => assert.strictEqual(value, 10));
    });

    test('runExclusive passes result (promise)', function() {
        return mutex
            .runExclusive<number>(() => Promise.resolve(10))
            .then(value => assert.strictEqual(value, 10));
    });

    test('runExclusive passes rejection', function() {
        return mutex
            .runExclusive<number>(() => Promise.reject('foo'))
            .then(
                () => Promise.reject('should have been rejected'),
                value => assert.strictEqual(value, 'foo')
            );
    });

    test('runExclusive passes exception', function() {
        return mutex
            .runExclusive<number>(() => {
                throw 'foo';
            })
            .then(
                () => Promise.reject('should have been rejected'),
                value => assert.strictEqual(value, 'foo')
            );
    });

    test('runExclusive is exclusive', function() {
        let flag = false;

        mutex
            .runExclusive(() => new Promise(
            resolve => setTimeout(
                () => {
                    flag = true;
                    resolve();
                }, 50
            )
        ));

        return mutex.runExclusive(() => assert(flag));
    });

    test('exceptions during runExclusive do not leave mutex locked', function() {
        let flag = false;

        mutex.runExclusive<number>(() => {
            flag = true;
            throw new Error();
        });

        return mutex.runExclusive(() => assert(flag));
    });

});