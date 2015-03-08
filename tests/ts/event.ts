///<reference path="./interface/mocha.d.ts"/>
///<reference path="../../typings/node/node.d.ts"/>

import Event = require('../../src/tools/event/Event');
import assert = require('assert');

suite('Event handling', function() {

    var event: Event<string>;

    setup(function() {
        event = new Event();
    });

    test('no handlers', function() {
        assert(!event.hasHandlers, 'event should report any registered handlers');
        assert.doesNotThrow(function() {
            event.dispatch('');
        }, 'dispatch should not throw');
    });

    suite('one handler', function() {
        test('no context', function() {
            var called = false;

            event.addHandler(function(payload: string) {
                assert.equal(payload, 'foo');
                called = true;
            });

            assert(event.hasHandlers, 'event should report registered handlers');
            
            event.dispatch('foo');
            assert(called, 'the handler should have been called');
        });

        test('with context', function() {
            var foo = 0;

            function handler(payload: string, context: number) {
                assert.equal(payload, 'foo');
                foo = context;
            };

            event.addHandler(handler, 5).dispatch('foo');

            assert.equal(foo, 5, 'context was not transferred correctly');

            assert(event.removeHandler(handler).hasHandlers, 'handler should only be remvoved if contet matches');
            assert(!event.removeHandler(handler, 5).hasHandlers, 'handler should be remvoved if contet matches');
        });
    });

    suite('two handlers', function() {
        var called1: boolean, called2: boolean,
            contexts: Array<number>;

        function handler1(payload: string) {
            assert.equal(payload, 'foo');
            called1 = true;
        };

        function handler2(payload: string) {
            assert.equal(payload, 'foo');
            called2 = true;
        };

        function ctxHandler(payload: string, context: any) {
            contexts[context] = context;
            assert.equal(payload, 'foo');
        }

        setup(function() {
            called1 = called2 = false;

            contexts = [0, 0, 0];

            event
                .addHandler(handler1)
                .addHandler(handler2);
        });

        test('both attached', function() {
            event.dispatch('foo');

            assert(called1, 'handler 1 should have been called');
            assert(called2, 'handler 2 should have been called');
        });

        test('handler 1 detached', function() {
            event.removeHandler(handler1);

            event.dispatch('foo');

            assert(!called1, 'handler 1 should not have been called');
            assert(called2, 'handler 2 should have been called');
        });

        test('handler 2 detached', function() {
            event.removeHandler(handler2);

            event.dispatch('foo');

            assert(called1, 'handler 1 should have been called');
            assert(!called2, 'handler 2 should not have been called');
        });

        test('context, both attached', function() {
            event
                .addHandler(ctxHandler, 1)
                .addHandler(ctxHandler, 2)
                .dispatch('foo');

            assert.equal(contexts[1], 1, 'context 1 was not transferred correctly');
            assert.equal(contexts[2], 2, 'context 2 was not transferred correctly');
        });

        test('context, handler 1 detached', function() {
            event
                .addHandler(ctxHandler, 1)
                .addHandler(ctxHandler, 2)
                .removeHandler(ctxHandler, 1)
                .dispatch('foo');

            assert.equal(contexts[1], 0, 'handler was not detached');
            assert.equal(contexts[2], 2, 'context 2 was not transferred correctly');
        });

        test('context, handler 2 detached', function() {
            event
                .addHandler(ctxHandler, 1)
                .addHandler(ctxHandler, 2)
                .removeHandler(ctxHandler, 2)
                .dispatch('foo');

            assert.equal(contexts[1], 1, 'context 1 was not transferred correctly');
            assert.equal(contexts[2], 0, 'handler was not detached');
        });
    });

});
