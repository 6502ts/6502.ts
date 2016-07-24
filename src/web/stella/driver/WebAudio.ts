import VanillaDriver from '../../driver/WebAudio';
import Board from '../../../machine/stella/Board';

export default class WebAudioDriver {

    init(): void {
        this._driver.init();
    }

    bind(board: Board): void {
        if (this._board) {
            return;
        }
        this._board = board;

        const audio = this._board.getAudioOutput();

        this._driver.bind(audio.channel0, audio.channel1);
        this._board.setAudioEnabled(true);
    }

    unbind(): void {
        if (!this._board) {
            return;
        }

        this._driver.unbind();
        this._board.setAudioEnabled(false);

        this._board = null;
    }

    private _driver = new VanillaDriver(2);
    private _board: Board = null;
}
