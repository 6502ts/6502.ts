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
        return this._database
            .cartridge
            .toArray()
            .then(cartridges => cartridges.map(c => cartridgeToState(c)));
    }

    saveCartridge(cartridge: CartridgeState): Promise<void> {
        return this._database
            .cartridge
            .where('hash')
            .equals(cartridge.hash)
            .toArray()
            .then(results => cartridgeFromState(cartridge, results.length > 0 ? results[0].id : undefined))
            .then(c => void(this._database.cartridge.put(c)));
    }

    deleteCartridge(cartridge: CartridgeState): Promise<void> {
        return this._database
            .cartridge
            .where('hash')
            .equals(cartridge.hash)
            .toArray()
            .then(results => this._database.cartridge.bulkDelete(results.map(c => c.id)));
    }

    getSettings(): Promise<SettingsState> {
        return this._database
            .settings
            .where('id')
            .equals(SETTINGS_UNIQUE_ID)
            .toArray()
            .then(results => settingsToState(results.length > 0 ? results[0] : undefined));
    }

    saveSettings(settings: SettingsState): Promise<void> {
        return this._database
            .settings
            .put(settingsFromState(settings))
            .then(() => undefined);
    }

    private _database = new Database();;

}
