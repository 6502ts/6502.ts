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
