import Dexie from 'dexie';

import * as Cartridge from './Cartridge';

export default class Database extends Dexie {

    constructor() {
        super('stellerator');

        this.version(1).stores({
            cartridge: '++id, name, &hash, buffer, tvMode, cartridgeType'
        });
    }

    cartridge: Dexie.Table<Cartridge.Type, Cartridge.indexType>;

}
