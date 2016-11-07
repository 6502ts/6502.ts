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

import CartridgeState from '../state/Cartridge';
import SettingsState from '../state/Settings';
import Database from './Database';

import {
    toState as cartridgeToState,
    fromState as cartridgeFromState
} from './Cartridge';

import {
    UNIQUE_ID as SETTINGS_UNIQUE_ID,
    toState as settingsToState,
    fromState as settingsFromState
} from './Settings';

export default class Manager {

    getAllCartridges(): Promise<Array<CartridgeState>> {
        return Promise.resolve(this._database
            .cartridge
            .toArray()
            .then(cartridges => cartridges.map(c => cartridgeToState(c)))
        );
    }

    saveCartridge(cartridge: CartridgeState): Promise<void> {
        return Promise.resolve(this._database
            .cartridge
            .where('hash')
            .equals(cartridge.hash)
            .toArray()
            .then(results => cartridgeFromState(cartridge, results.length > 0 ? results[0].id : undefined))
            .then(c => void(this._database.cartridge.put(c)))
        );
    }

    deleteCartridge(cartridge: CartridgeState): Promise<void> {
        return Promise.resolve(this._database
            .cartridge
            .where('hash')
            .equals(cartridge.hash)
            .toArray()
            .then(results => this._database.cartridge.bulkDelete(results.map(c => c.id)))
        );
    }

    getSettings(): Promise<SettingsState> {
        return Promise.resolve(this._database
            .settings
            .where('id')
            .equals(SETTINGS_UNIQUE_ID)
            .toArray()
            .then(results => settingsToState(results.length > 0 ? results[0] : undefined))
        );
    }

    saveSettings(settings: SettingsState): Promise<void> {
        return Promise.resolve(this._database
            .settings
            .put(settingsFromState(settings))
            .then(() => undefined)
        );
    }

    private _database = new Database();;

}
