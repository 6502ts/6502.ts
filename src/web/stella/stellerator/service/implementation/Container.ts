/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2017  Christian Speckner & contributors
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

import {Store} from 'redux';
import {Event} from 'microevent.ts';

import State from '../../state/State';
import ContainerInterface from '../Container';
import EmulationProvider from './EmulationProvider';

interface InjectableWithStore {
    setStore(store: Store<State>): void;
}

class Container implements ContainerInterface {

    setStore(store: Store<State>): this {
        if (this._store) {
            throw new Error('store already configured');
        }

        this._store = store;
        this._storeConfigured.dispatch(store);

        return this;
    }

    getEmulationProvider(): EmulationProvider {
        return this._getOrCreateSingetonService(
            'emulation-provider',
            () => new EmulationProvider(),
            true
        );
    }

    private _getOrCreateSingetonService<T>(
        key: string,
        factory: () => T,
        injectStore = false
    ) {
        if (this._services.has(key)) {
            return this._services.get(key);
        }

        const service = factory() as (T & InjectableWithStore);
        this._services.set(key, service);

        if (injectStore) {
            if (this._store) {
                service.setStore(this._store);
            } else {
                this._storeConfigured.addHandler(
                    store => service.setStore(store)
                );
            }
        }

        return service;
    }

    private _services = new Map<string, any>();
    private _storeConfigured = new Event<Store<State>>();
    private _store: Store<State>;
}

export default Container;
