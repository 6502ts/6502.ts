import EmulationContextInterface from '../EmulationContextInterface';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import VideoOutputInterface from '../../../../machine/io/VideoOutputInterface';
import Board from '../../../../machine/stella/Board';

export default class EmulationContext implements EmulationContextInterface {

    constructor(
        private _board: Board
    ) {}

    getVideo(): VideoOutputInterface {
        return this._board.getVideoOutput();
    }

    getJoystick(i: number): JoystickInterface {
        switch (i) {
            case 0:
                return this._board.getJoystick0();

            case 1:
                return this._board.getJoystick1();

            default:
                throw new Error(`invalid joystick index ${i}`);
        }
    }

    getControlPanel(): ControlPanelInterface {
        return this._board.getControlPanel();
    }

    getPaddle(i: number): PaddleInterface {
        if (i >= 0 && i < 4) {
            return this._board.getPaddle(i);
        } else {
            throw new Error(`invalid paddle index ${i}`);
        }
    }

    getAudio(): Board.Audio {
        return this._board.getAudioOutput();
    }

}
