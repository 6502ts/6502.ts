import SimpleSerialIOInterface = require('../io/SimpleSerialIOInterface');
import VanillaBoard = require('../vanilla/Board');
import Memory = require('./Memory');

class Board extends VanillaBoard {

    getSerialIO(): SimpleSerialIOInterface {
        return this._bus;
    }

    protected _createBus() {
        return new Memory();
    }

    protected _bus: Memory;
}

export = Board;
