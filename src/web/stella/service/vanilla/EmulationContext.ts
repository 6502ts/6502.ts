import EmulationContextInterface from '../EmulationContextInterface';
import Board from '../../../../machine/stella/Board';
import VideoOutputInterface from '../../../../machine/io/VideoOutputInterface';

export default class EmulationContext implements EmulationContextInterface {

    constructor(
        private _board: Board
    ) {}

    getVideo(): VideoOutputInterface {
        return this._board.getVideoOutput();
    }

    getBoard(): Board {
        return this._board;
    }

}
