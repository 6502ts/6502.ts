import Dexie from 'dexie';
import { Cartridge, Settings } from '../../elm/Stellerator/Main.elm';
import { injectable } from 'inversify';

export interface CartridgeWithImage {
    cartridge: Cartridge;
    image: Uint8Array;
}

interface RomImage {
    hash: string;
    image: Uint8Array;
}

const SETTINGS_ID = 0;
const DB_NAME = 'stellerator-ng';

class Database extends Dexie {
    constructor() {
        super(DB_NAME);

        this.version(1).stores({
            cartridges: '&hash',
            roms: '&hash',
            settings: '&id'
        });
    }

    cartridges: Dexie.Table<Cartridge, string>;

    roms: Dexie.Table<RomImage, string>;

    settings: Dexie.Table<Settings & { id: number }, number>;
}

@injectable()
class Storage {
    getAllCartridges(): Promise<Array<Cartridge>> {
        return this._database.cartridges.toArray();
    }

    insertCartridges(cartridges: Array<CartridgeWithImage>): Promise<void> {
        return this._database.transaction('rw', [this._database.cartridges, this._database.roms], async () => {
            await Promise.all([
                this._database.cartridges.bulkPut(cartridges.map(c => c.cartridge)),
                this._database.roms.bulkPut(cartridges.map(c => ({ hash: c.cartridge.hash, image: c.image })))
            ]);
        });
    }

    async updateCartridge(cartridge: Cartridge): Promise<void> {
        return this._database.transaction('rw', [this._database.cartridges], async () => {
            if (!(await this._database.cartridges.get(cartridge.hash))) {
                return;
            }

            await this._database.cartridges.put(cartridge);
        });
    }

    deleteCartridge(hash: string): Promise<void> {
        return this._database.transaction('rw', [this._database.cartridges, this._database.roms], async () => {
            await Promise.all([this._database.cartridges.delete(hash), this._database.roms.delete(hash)]);
        });
    }

    deleteAllCartridges(): Promise<void> {
        return this._database.cartridges.clear();
    }

    async getSettings(): Promise<Settings | undefined> {
        const record = await this._database.settings.get(SETTINGS_ID);

        if (!record) {
            return undefined;
        }

        const { id, ...settings } = record;
        return settings;
    }

    async saveSettings(settings: Settings): Promise<void> {
        await this._database.settings.put({ ...settings, id: SETTINGS_ID });
    }

    async dropDatabase(): Promise<void> {
        this._database.close();
        await indexedDB.deleteDatabase(DB_NAME);

        this._database = new Database();
    }

    private _database = new Database();
}

export default Storage;
