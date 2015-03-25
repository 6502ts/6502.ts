'use strict';

import PoolMember = require('./PoolMember');
import Event = require('../event/Event');
import PoolInterface = require('./PoolInterface');
import PoolMemberInterface = require('./PoolMemberInterface');

class Pool<T> implements PoolInterface<T> {

    constructor(
        private _factory: Pool.FactoryInterface<T>
    ) {}

    get(): PoolMemberInterface<T> {
        var member: PoolMember<T>;

        if (this._poolSize === 0) {
            member = new PoolMember<T>(
                this._factory(),
                this._recycleMember.bind(this),
                this._disposeMember.bind(this)
            );
        } else {
            member = this._pool[--this._poolSize];
            member._isAvailable = false;
        }

        return member;
    }

    event = {
        recycle: new Event<T>(),
        dispose: new Event<T>()
    }

    private _recycleMember(victim: PoolMember<T>) {
        if (victim._isAvailable)
            throw new Error('Trying to recycle already recycled pool member');

        if (victim._isDisposed)
            throw new Error('Trying to recycle an already disposed pool member');

        var position = this._poolSize++;

        this._pool[position] = victim;
        
        victim._isAvailable = true;
        victim._poolPosition = position;

        this.event.recycle.dispatch(victim.get());
    }

    private _disposeMember(victim: PoolMember<T>) {
        if (victim._isDisposed)
            throw new Error('Trying to dispose of an already disposed pool member');

        if (victim._isAvailable) {
            if (this._poolSize > 1) {
                this._pool[victim._poolPosition] = this._pool[this._poolSize - 1];
            }

            this._poolSize--;
        }

        victim._isDisposed = true;

        this.event.dispose.dispatch(victim.get());
    }

    private _pool: Array<PoolMember<T> > = [];
    
    private _poolSize = 0;
}

module Pool {
    export interface FactoryInterface<T> {
        (): T
    }

    export interface RecycleCallbackInterface<T> {
        (value: T): void;
    }

    export interface DisposeCallbackInterface<T> {
        (value: T): void;
    }
}

export = Pool;
