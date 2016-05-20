import * as path from 'path';

import FilesystemProviderInterface from '../fs/FilesystemProviderInterface';
import DebuggerCLI from './DebuggerCLI';

import Board from '../machine/stella/Board';
import CartridgeInterface from '../machine/stella/CartridgeInterface';
import Cartridge4k from '../machine/stella/Cartridge4k';
import StellaConfig from '../machine/stella/Config';
import VideoOutputInterface from '../machine/io/VideoOutputInterface';

class StellaCLI extends DebuggerCLI {

    constructor(fsProvider: FilesystemProviderInterface, protected _cartridgeFile: string) {
        super(fsProvider);
    }

    getVideoOutput(): VideoOutputInterface {
        return this._board.getVideoOutput();
    }

    protected _initializeHardware(): void {
        const fileBuffer = this._fsProvider.readBinaryFileSync(this._cartridgeFile),
            cartridge = new Cartridge4k(fileBuffer),
            config = new StellaConfig(StellaConfig.TvMode.ntsc),
            board = new Board(config, cartridge);

        this._board = board;
        this._cartridge = cartridge;
    }

    protected _board: Board;
    protected _cartridge: CartridgeInterface;

}

export default StellaCLI;
