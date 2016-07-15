import Cartridge from './Cartridge';
import GuiState from './GuiState';

export default class State {

    cartridges: {[hash: string]: Cartridge} = {
        '123': new Cartridge('Hanswurst', []),
        '456': new Cartridge('Dummelbummel', [])
    };

    currentCartridge: Cartridge = null;
    guiState = new GuiState();

}
