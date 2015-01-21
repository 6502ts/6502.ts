'use strict';

import EventInterface = require('./EventInterface');

var factories: Array<Function> = [];

factories[0] = function(): Function {
    return function() {};
};

factories[1] = function(callback: Function): Function {
    return callback;
}

function getFactory(handlerCount: number) {
    if (!factories[handlerCount]) factories[handlerCount] = compileFactory(handlerCount);

    return factories[handlerCount];
}

function compileFactory(handlerCount: number): Function {
    var src: string = 'return function(payload) {\n',
        args: Array<string> = [];

    for (var i = 0; i < handlerCount; i++) {
        args.push('c' + i);
        src += '    c' + i + '(payload);\n';
    }

    src += '};';

    return new (Function.bind(Function, args))(src);
}

class Event<EventPayload> implements EventInterface<EventPayload> {

    constructor() {
        this._createDispatcher();
    }

    addHandler(handler: (payload: EventPayload) => void): Event<EventPayload> {
        this._handlers.push(handler);
        this._createDispatcher();

        return this;
    }

    removeHandler(handler: (payload: EventPayload) => void): Event<EventPayload> {
        var idx = this._handlers.indexOf(handler);

        if (idx >= 0) {
            this._handlers.splice(idx, 1);
            this._createDispatcher();
        }

        return this;
    }

    hasHandlers(): boolean {
        return !!this._handlers.length;
    }

    dispatch: (payload: EventPayload) => void;

    private _createDispatcher() {
        this.dispatch = getFactory(this._handlers.length).apply(this, this._handlers);
    }

    private _handlers: Array<(payload: EventPayload) => void> = [];
}

export = Event;
