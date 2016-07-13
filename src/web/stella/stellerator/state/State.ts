import Cartridge from './Cartridge';
import GuiState from './GuiState';

export default class State {

    constructor() {
        this.cartridges.push(new Cartridge('Hanswurst', []));
        this.cartridges.push(new Cartridge('Dummelbummel', []));
    }

    cartridges: Array<Cartridge> = [];
    currentCartridge: Cartridge = null;
    guiState = new GuiState();

}
