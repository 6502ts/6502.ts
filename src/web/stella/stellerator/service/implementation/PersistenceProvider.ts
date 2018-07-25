/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import { Middleware, MiddlewareAPI, Action, Store } from 'redux';

import { initCartridges } from '../../actions/root';
import { initSettings } from '../../actions/settings';
import PersistenceProviderInterface from '../PersistenceProvider';
import StorageManager from '../StorageManager';
import { types as ActionType } from '../../actions/root';
import { isSettingsChange } from '../../actions/settings';
import State from '../../state/State';

class PersistenceProvider implements PersistenceProviderInterface {
    constructor(private _manager: StorageManager) {}

    setStore(store: Store<State>): void {
        this._store = store;
    }

    getMiddleware(): Middleware {
        return this._middleware;
    }

    async init(): Promise<any> {
        const [cartridges, settings] = await Promise.all([
            this._manager.getAllCartridges(),
            this._manager.getSettings()
        ]);

        await this._store.dispatch(initCartridges(cartridges));
        await this._store.dispatch(initSettings(settings));
    }

    private _middleware = ((api: MiddlewareAPI) => (next: (a: Action) => any) => async (a: Action): Promise<any> => {
        if (!a) {
            return next(a);
        }

        if (isSettingsChange(a)) {
            await next(a);
            return this._manager.saveSettings(api.getState().settings);
        }

        switch (a.type) {
            case ActionType.saveCurrentCartridge:
                await this._manager.saveCartridge(api.getState().currentCartridge);
                return next(a);

            case ActionType.deleteCurrentCartridge:
                await this._manager.deleteCartridge(api.getState().currentCartridge);
                return next(a);

            default:
                return next(a);
        }
    }) as Middleware;

    private _store: Store<State>;
}

export { PersistenceProvider as default };
