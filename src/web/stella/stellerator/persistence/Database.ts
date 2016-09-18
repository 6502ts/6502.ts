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

        this.version(3).stores({
            cartridge: '++id, name, &hash, buffer, tvMode, cartridgeType, emulatePaddles',
            settings: 'id'
        });

        this.version(4)
            .stores({
                cartridge: '++id, &hash',
                settings: 'id'
            })
            .upgrade(transaction => transaction
                .table<Cartridge.Type, Cartridge.indexType>('cartridge')
                .each((cartridge, c) => {
                    const cursor: IDBCursor = (c as any);

                    if (typeof(cartridge.emulatePaddles) === 'undefined') {
                        cartridge.emulatePaddles = true;
                    }

                    if (typeof(cartridge.rngSeed) === 'undefined') {
                        cartridge.rngSeed = 0;
                    }

                    if (typeof(cartridge.rngSeedAuto) === 'undefined') {
                        cartridge.rngSeedAuto = true;
                    }

                    if (typeof(cartridge.audioEnabled) === 'undefined') {
                        cartridge.audioEnabled = true;
                    }

                    cursor.update(cartridge);
                })
            );
    }

    cartridge: Dexie.Table<Cartridge.Type, Cartridge.indexType>;

    settings: Dexie.Table<Settings.Type, Settings.indexType>;
}
