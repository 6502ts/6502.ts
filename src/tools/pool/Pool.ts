/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import { Event } from 'microevent.ts';

import PoolMember from './PoolMember';
import PoolInterface from './PoolInterface';

class Pool<T> implements PoolInterface<T> {
    constructor(private _factory: Pool.FactoryInterface<T>) {}

    get(): PoolMember<T> {
        let member: PoolMember<T>;

        if (this._poolSize === 0) {
            const newItem = this._factory();

            member = new PoolMember<T>(
                newItem,
                (victim: PoolMember<T>) => this._releaseMember(victim),
                (victim: PoolMember<T>) => this._disposeMember(victim)
            );
        } else {
            member = this._pool[--this._poolSize];
            member._isAvailable = false;
        }

        return member;
    }

    private _releaseMember(victim: PoolMember<T>) {
        if (victim._isAvailable) {
            throw new Error('Trying to release an already released pool member');
        }

        if (victim._isDisposed) {
            throw new Error('Trying to release an already disposed pool member');
        }

        const position = this._poolSize++;

        this._pool[position] = victim;

        victim._isAvailable = true;
        victim._poolPosition = position;

        this.event.release.dispatch(victim.get());
    }

    private _disposeMember(victim: PoolMember<T>) {
        if (victim._isDisposed) {
            throw new Error('Trying to dispose of an already disposed pool member');
        }

        if (victim._isAvailable) {
            if (this._poolSize > 1) {
                this._pool[victim._poolPosition] = this._pool[this._poolSize - 1];
            }

            this._poolSize--;
        }

        victim._isDisposed = true;

        this.event.dispose.dispatch(victim.get());
    }

    event = {
        release: new Event<T>(),
        dispose: new Event<T>()
    };

    private _pool: Array<PoolMember<T>> = [];

    private _poolSize = 0;
}

namespace Pool {
    export interface FactoryInterface<T> {
        (): T;
    }

    export interface RecycleCallbackInterface<T> {
        (value: T): void;
    }

    export interface DisposeCallbackInterface<T> {
        (value: T): void;
    }
}

export { Pool as default };
