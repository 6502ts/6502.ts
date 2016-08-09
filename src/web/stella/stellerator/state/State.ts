import Cartridge from './Cartridge';
import GuiState from './GuiState';
import EmulationState from './Emulation';
import Settings from './Settings';

export default class State implements Changeset {

    constructor(changes?: Changeset, old?: State) {
        Object.assign(this, old, changes);
    }

    readonly routing: any;
    readonly cartridges: {[hash: string]: Cartridge} = {};
    readonly currentCartridge: Cartridge = null;

    readonly guiState: GuiState;
    readonly emulationState: EmulationState;
    readonly settings: Settings;
}

interface Changeset {
    routing?: any;
    cartridges?: {[hash: string]: Cartridge};
    currentCartridge?: Cartridge;
    guiState?: GuiState;
    emulationState?: EmulationState;
    settings?: Settings;
}
