import Dexie from 'dexie';
import { Cartridge } from '../../elm/Stellerator/Main.elm';
import { injectable } from 'inversify';

export interface CartridgeWithImage {
    cartridge: Cartridge;
    image: Uint8Array;
}

interface RomImage {
    hash: string;
    image: Uint8Array;
}

class Database extends Dexie {
    constructor() {
        super('stellerator-ng');

        this.version(1).stores({
            cartridges: '&hash',
            roms: '&hash'
        });
    }

    cartridges: Dexie.Table<Cartridge, string>;

    roms: Dexie.Table<RomImage, string>;
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

    private _database = new Database();
}

export default Storage;
