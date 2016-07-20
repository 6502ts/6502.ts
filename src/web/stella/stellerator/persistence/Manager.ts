import CartridgeState from '../state/Cartridge';
import Database from './Database';

import {
    toState as cartridgeToState,
    fromState as cartridgeFromState
} from './Cartridge';

export default class Manager {

    getAllCartridges(): Promise<Array<CartridgeState>> {
        return this._database
            .cartridge
            .toArray()
            .then(cartridges => cartridges.map(c => cartridgeToState(c)));
    }

    saveCartridge(cartridge: CartridgeState) {
        return this._database
            .cartridge
            .where('hash')
            .equals(cartridge.hash)
            .toArray()
            .then(results => cartridgeFromState(cartridge, results.length > 0 ? results[0].id : undefined))
            .then(c => this._database.cartridge.put(c));
    }

    deleteCartridge(cartridge: CartridgeState) {
        return this._database
            .cartridge
            .where('hash')
            .equals(cartridge.hash)
            .toArray()
            .then(results => this._database.cartridge.bulkDelete(results.map(c => c.id)));
    }

    private _database = new Database();;

}
