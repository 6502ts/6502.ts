import VideoEndpointInterface from '../../driver/VideoEndpointInterface';
import ControlPanelInterface from '../../../machine/stella/ControlPanelInterface';
import JoystickInterface from '../../../machine/io/DigitalJoystickInterface';
import PaddleInterface from '../../../machine/io/PaddleInterface';
import Board from '../../../machine/stella/Board';

interface EmulationContextInterface {

    getVideo(): VideoEndpointInterface;

    getJoystick(i: number): JoystickInterface;

    getControlPanel(): ControlPanelInterface;

    getPaddle(i: number): PaddleInterface;

    getAudio(): Board.Audio;

}

export default EmulationContextInterface;
