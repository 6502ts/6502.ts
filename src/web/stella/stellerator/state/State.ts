import Cartridge from './Cartridge';
import GuiState from './GuiState';

export default class State {

    constructor(
        public cartridges: {[hash: string]: Cartridge} = {
            '123': new Cartridge('Hanswurst', [], '123'),
            '456': new Cartridge('Dummelbummel', [], '456'),
            '789': new Cartridge('Wild thing', [], '789')
        },
        public currentCartridge: Cartridge = null,
        public guiState = new GuiState()
    ) {}

    public routing: any;

}
