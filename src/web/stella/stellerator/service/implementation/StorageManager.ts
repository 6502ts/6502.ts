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

import StorageManagerInterface from '../StorageManager';
import CartridgeModel from '../../model/Cartridge';
import SettingsModel from '../../model/Settings';
import Database from './storage/Database';

import { toState as cartridgeToState, fromModel as cartridgeFromState } from './storage/Cartridge';

import {
    UNIQUE_ID as SETTINGS_UNIQUE_ID,
    toModel as settingsToState,
    fromModel as settingsFromState
} from './storage/Settings';

export default class StorageManager implements StorageManagerInterface {
    getAllCartridges(): Promise<Array<CartridgeModel>> {
        return Promise.resolve(
            this._database.cartridge.toArray().then(cartridges => cartridges.map(c => cartridgeToState(c)))
        );
    }

    saveCartridge(cartridge: CartridgeModel): Promise<void> {
        return Promise.resolve(
            this._database.cartridge
                .where('hash')
                .equals(cartridge.hash)
                .toArray()
                .then(results => cartridgeFromState(cartridge, results.length > 0 ? results[0].id : undefined))
                .then(c => void this._database.cartridge.put(c))
        );
    }

    deleteCartridge(cartridge: CartridgeModel): Promise<void> {
        return Promise.resolve(
            this._database.cartridge
                .where('hash')
                .equals(cartridge.hash)
                .toArray()
                .then(results => this._database.cartridge.bulkDelete(results.map(c => c.id)))
        );
    }

    getImage(hash: string): Promise<Uint8Array> {
        return Promise.resolve(this._database.image.get(hash).then(image => image && image.buffer));
    }

    saveImage(hash: string, buffer: Uint8Array): Promise<void> {
        return Promise.resolve(this._database.image.put({ hash, buffer }).then(() => undefined));
    }

    deleteImage(hash: string): Promise<void> {
        return Promise.resolve(this._database.image.delete(hash));
    }

    getSettings(): Promise<SettingsModel> {
        return Promise.resolve(
            this._database.settings
                .where('id')
                .equals(SETTINGS_UNIQUE_ID)
                .toArray()
                .then(results => settingsToState(results.length > 0 ? results[0] : undefined))
        );
    }

    saveSettings(settings: SettingsModel): Promise<void> {
        return Promise.resolve(this._database.settings.put(settingsFromState(settings)).then(() => undefined));
    }

    private _database = new Database();
}
