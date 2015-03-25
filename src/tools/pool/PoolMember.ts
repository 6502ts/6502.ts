'use strict';

import PoolMemberInterface = require('./PoolMemberInterface')

class PoolMember<T> implements PoolMemberInterface<T> {

    constructor(
        private _value: T,
        private _recycleCB: (victim: PoolMember<T>) => void,
        private _disposeCB: (victim: PoolMember<T>) => void
    ) {}

    get(): T {
        return this._value;
    }

    recycle(): void {
        this._recycleCB(this);
    }

    dispose(): void {
        this._disposeCB(this);
    }

    public _isAvailable = false;
    public _isDisposed = false;
    public _poolPosition: number;
}

export = PoolMember;
