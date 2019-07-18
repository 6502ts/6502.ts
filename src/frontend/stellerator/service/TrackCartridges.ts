import { injectable, inject } from 'inversify';
import { Ports, Cartridge } from '../../elm/Stellerator/Main.elm';
import Storage from './Storage';

@injectable()
class TrackCartridges {
    constructor(@inject(Storage) private _storage: Storage) {}

    init(ports: Ports): void {
        ports.updateCartridge_.subscribe(this._onCartridgeUpdated);
        ports.deleteCartridge_.subscribe(this._onCartridgeDeleted);
        ports.deleteAllCartridges_.subscribe(this._onDeleteAllCartridges);
    }

    private _onCartridgeUpdated = (cartridge: Cartridge) => this._storage.updateCartridge(cartridge);

    private _onCartridgeDeleted = (hash: string) => this._storage.deleteCartridge(hash);

    private _onDeleteAllCartridges = () => this._storage.deleteAllCartridges();
}

export default TrackCartridges;
