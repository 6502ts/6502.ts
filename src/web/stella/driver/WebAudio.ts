import VanillaDriver from '../../driver/WebAudio';
import Board from '../../../machine/stella/Board';

export default class WebAudioDriver {

    init(): void {
        this._driver.init();
    }

    bind(audio: Board.Audio): void {
        if (this._audio) {
            return;
        }
        this._audio = audio;

        this._driver.bind(this._audio.channel0, this._audio.channel1);
    }

    unbind(): void {
        if (!this._audio) {
            return;
        }

        this._driver.unbind();

        this._audio = null;
    }

    private _driver = new VanillaDriver(2);
    private _audio: Board.Audio = null;
}
