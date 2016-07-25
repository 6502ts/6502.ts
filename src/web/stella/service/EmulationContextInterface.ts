import VideoOutputInterface from '../../../machine/io/VideoOutputInterface';
import ControlPanelInterface from '../../../machine/stella/ControlPanelInterface';
import JoystickInterface from '../../../machine/io/DigitalJoystickInterface';
import PaddleInterface from '../../../machine/io/PaddleInterface';
import Board from '../../../machine/stella/Board';

interface EmulationContextInterface {

    getVideo(): VideoOutputInterface;

    getJoystick(i: number): JoystickInterface;

    getControlPanel(): ControlPanelInterface;

    getPaddle(i: number): PaddleInterface;

    getAudio(): Board.Audio;

}

export default EmulationContextInterface;
