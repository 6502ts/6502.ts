import { injectable, inject } from 'inversify';
import { Ports, Cartridge } from '../../elm/Stellerator/Main.elm';
import Storage from './Storage';
import Emulation from './Emulation';
import { Mutex } from 'async-mutex';

@injectable()
class TrackCartridges {
    constructor(@inject(Storage) private _storage: Storage, @inject(Emulation) private _emulation: Emulation) {}

    init(ports: Ports): void {
        ports.updateCartridge_.subscribe(this._onCartridgeUpdated);
        ports.deleteCartridge_.subscribe(this._onCartridgeDeleted);
        ports.deleteAllCartridges_.subscribe(this._onDeleteAllCartridges);
    }

    private async _updateCartridge(cartridge: Cartridge): Promise<void> {
        await this._storage.updateCartridge(cartridge);
        await this._emulation.updateCartridge(cartridge);
    }

    private _onCartridgeUpdated = async (cartridge: Cartridge) =>
        this._mutex.runExclusive(() => this._updateCartridge(cartridge));

    private _onCartridgeDeleted = (hash: string) => this._storage.deleteCartridge(hash);

    private _onDeleteAllCartridges = () => this._storage.deleteAllCartridges();

    private _mutex = new Mutex();
}

export default TrackCartridges;
