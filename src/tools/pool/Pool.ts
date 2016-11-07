/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */


import {Event} from 'microevent.ts';

import PoolMember from './PoolMember';
import PoolInterface from './PoolInterface';

class Pool<T> implements PoolInterface<T> {

    constructor(
        private _factory: Pool.FactoryInterface<T>
    ) {}

    get(): PoolMember<T> {
        let member: PoolMember<T>;

        if (this._poolSize === 0) {
            const newItem = this._factory();

            member = newItem && new PoolMember<T>(
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

    event = {
        release: new Event<T>(),
        dispose: new Event<T>()
    };

    private _releaseMember(victim: PoolMember<T>) {
        if (victim._isAvailable)
            throw new Error('Trying to release an already released pool member');

        if (victim._isDisposed)
            throw new Error('Trying to release an already disposed pool member');

        const position = this._poolSize++;

        this._pool[position] = victim;

        victim._isAvailable = true;
        victim._poolPosition = position;

        this.event.release.dispatch(victim.get());
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
        (): T;
    }

    export interface RecycleCallbackInterface<T> {
        (value: T): void;
    }

    export interface DisposeCallbackInterface<T> {
        (value: T): void;
    }
}

export default Pool;
