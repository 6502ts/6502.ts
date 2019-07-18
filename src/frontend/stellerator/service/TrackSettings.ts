import { injectable, inject } from 'inversify';
import Storage from './Storage';
import { Ports, Settings } from '../../elm/Stellerator/Main.elm';

@injectable()
class TrackSettings {
    constructor(@inject(Storage) private _storage: Storage) {}

    init(ports: Ports): void {
        ports.updateSettings_.subscribe(this._onSettingsUpdate);
    }

    private _onSettingsUpdate = (settings: Settings) => this._storage.saveSettings(settings);
}

export default TrackSettings;
