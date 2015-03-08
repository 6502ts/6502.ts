'use strict';

import EventInterface = require('./EventInterface');

var factories: Array<Function> = [];

factories[0] = function(): Function {
    return function dispatcher0() {};
};

factories[1] = function(callback: Function, context?: any): Function {
    if (typeof(context) === 'undefined') return callback;

    return function dispatcher1(payload: any) {
        callback(payload, context);
    }
}

function getFactory(handlerCount: number) {
    if (!factories[handlerCount]) factories[handlerCount] = compileFactory(handlerCount);

    return factories[handlerCount];
}

function compileFactory(handlerCount: number): Function {
    var src: string = 'return function dispatcher' + handlerCount + '(payload) {\n',
        argsHandlers: Array<string> = [],
        argsContexts: Array<string> = [];

    for (var i = 0; i < handlerCount; i++) {
        argsHandlers.push('cb' + i);
        argsContexts.push('ctx' + i);
        src += '    cb' + i + '(payload, ctx' + i + ');\n';
    }

    src += '};';

    return new (Function.bind(Function, argsHandlers.concat(argsContexts)))(src);
}

class Event<EventPayload> implements EventInterface<EventPayload> {

    constructor() {
        this._createDispatcher();
    }

    addHandler(handler: (payload: EventPayload, context: any) => void, context?: any): Event<EventPayload> {
        this._handlers.push(handler);
        this._contexts.push(context);

        this._createDispatcher();
        this._updateHasHandlers();

        return this;
    }

    removeHandler(handler: (payload: EventPayload, context: any) => void, context?: any): Event<EventPayload> {
        var handlerCount = this._handlers.length;

        for (var idx = 0; idx < handlerCount; idx++) {
            if (this._handlers[idx] === handler && this._contexts[idx] === context) break;
        }

        if (idx < handlerCount) {
            this._handlers.splice(idx, 1);
            this._contexts.splice(idx, 1);

            this._createDispatcher();
            this._updateHasHandlers();
        }

        return this;
    }

    dispatch: (payload: EventPayload) => void;

    hasHandlers = false;

    private _updateHasHandlers() {
        this.hasHandlers = !!this._handlers.length;
    }

    private _createDispatcher() {
        this.dispatch = getFactory(this._handlers.length).apply(this, this._handlers.concat(this._contexts));
    }

    private _handlers: Array<(payload: EventPayload, context: any) => void> = [];
    private _contexts: Array<any> = [];
}

export = Event;
