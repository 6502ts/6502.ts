import SimpleSerialIOInterface from '../io/SimpleSerialIOInterface';
import VanillaBoard from '../vanilla/Board';
import Memory from './Memory';

class Board extends VanillaBoard {

    getSerialIO(): SimpleSerialIOInterface {
        return this._bus;
    }

    protected _createBus() {
        return new Memory();
    }

    protected _bus: Memory;
}

export default Board;
