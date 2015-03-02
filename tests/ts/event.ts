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
        assert(!event.hasHandlers(), 'event should report any registered handlers');
        assert.doesNotThrow(function() {
            event.dispatch('');
        }, 'dispatch should not throw');
    });

    test('one handler', function() {
        var called = false;

        event.addHandler(function(payload: string) {
            assert.equal(payload, 'foo');
            called = true;
        });

        assert(event.hasHandlers(), 'event should report registered handlers');
        
        event.dispatch('foo');
        assert(called, 'the handler should have been called');
    });

    suite('two handlers', function() {
        var called1: boolean, called2: boolean,
            handler1: (payload: string) => void, handler2: (payload: string) => void;

        setup(function() {
            called1 = called2 = false;

            handler1 = function(payload: string) {
                assert.equal(payload, 'foo');
                called1 = true;
            };

            handler2 = function(payload: string) {
                assert.equal(payload, 'foo');
                called2 = true;
            };

            event.addHandler(handler1);
            event.addHandler(handler2);
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
    });

});
