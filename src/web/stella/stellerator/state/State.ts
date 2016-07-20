import Cartridge from './Cartridge';
import GuiState from './GuiState';

export default class State {

    constructor(
        public cartridges: {[hash: string]: Cartridge} = {},
        public currentCartridge: Cartridge = null,
        public guiState = new GuiState()
    ) {}

    public routing: any;

}
