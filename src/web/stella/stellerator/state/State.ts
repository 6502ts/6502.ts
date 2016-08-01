import Cartridge from './Cartridge';
import GuiState from './GuiState';
import EmulationState from './Emulation';
import Settings from './Settings';

export default class State implements Changeset {

    constructor(changes?: Changeset, old?: State) {
        Object.assign(this, old, changes);
    }

    routing: any;
    cartridges: {[hash: string]: Cartridge} = {};
    currentCartridge: Cartridge = null;
    guiState: GuiState;
    emulationState: EmulationState;
    settings: Settings;
}

interface Changeset {
    cartridges?: {[hash: string]: Cartridge};
    currentCartridge?: Cartridge;
    guiState?: GuiState;
    emulationState?: EmulationState;
    settings?: Settings;
}
