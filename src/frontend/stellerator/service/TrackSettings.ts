import { injectable, inject } from 'inversify';
import Storage from './Storage';
import { Ports, Settings } from '../../elm/Stellerator/Main.elm';
import Emulation from './Emulation';
import { Mutex } from 'async-mutex';

@injectable()
class TrackSettings {
    constructor(@inject(Storage) private _storage: Storage, @inject(Emulation) private _emulation: Emulation) {}

    init(ports: Ports): void {
        ports.updateSettings_.subscribe(this._onSettingsUpdate);
    }

    private async updateSettings(settings: Settings): Promise<void> {
        await this._storage.saveSettings(settings);
        await this._emulation.updateSettings(settings);
    }

    private _onSettingsUpdate = (settings: Settings) => this._mutex.runExclusive(() => this.updateSettings(settings));

    private _mutex = new Mutex();
}

export default TrackSettings;
