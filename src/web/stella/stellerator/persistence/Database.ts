import Dexie from 'dexie';

import * as Cartridge from './Cartridge';
import * as Settings from './Settings';

export default class Database extends Dexie {

    constructor() {
        super('stellerator');

        this.version(1).stores({
            cartridge: '++id, name, &hash, buffer, tvMode, cartridgeType'
        });

        this.version(2).stores({
            cartridge: '++id, name, &hash, buffer, tvMode, cartridgeType',
            settings: 'id'
        });
    }

    cartridge: Dexie.Table<Cartridge.Type, Cartridge.indexType>;

    settings: Dexie.Table<Settings.Type, Settings.indexType>;
}
