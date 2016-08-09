import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import Joystick from '../../../../machine/io/DigitalJoystick';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';
import ControlPanel from '../../../../machine/stella/ControlPanel';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import Paddle from '../../../../machine/io/Paddle';
import AudioOutputInterface from '../../../../machine/io/AudioOutputInterface';
import AudioOutputBuffer from '../../../../tools/AudioOutputBuffer';
import Board from '../../../../machine/stella/Board';

import EmulationContextInterface from '../EmulationContextInterface';
import PoolMemberInterface from '../../../../tools/pool/PoolMemberInterface';
import Event from '../../../../tools/event/Event';

class EmulationContext implements EmulationContextInterface {

    constructor() {
        this._videoEndpointStub = {
            getWidth: () => 160,
            getHeight: () => 228,
            newFrame: new Event<PoolMemberInterface<ImageData>>()
        };

        const audioBufferStub = new AudioOutputBuffer(new Float32Array([0]), 44100);

        this._audioOutputStub = {
            bufferChanged: new Event<number>(),
            volumeChanged: new Event<number>(),
            stop: new Event<void>(),
            getBuffer: () => audioBufferStub,
            getVolume: () => 0
        };

        for (let i = 0; i < 2; i++) {
            this._joysticks[i] = new Joystick();
        }

        for (let i = 0; i < 4; i++) {
            this._paddles[i] = new Paddle();
        }
    }

    getVideo(): VideoEndpointInterface {
        return this._videoEndpointStub;
    }

    getJoystick(i: number): JoystickInterface {
        if (i < 0 || i > 1) {
            throw new Error(`invalid joystick index ${i}`);
        }

        return this._joysticks[i];
    }

    getControlPanel(): ControlPanelInterface {
        return this._controlPanel;
    }

    getPaddle(i: number): PaddleInterface {
        if (i < 0 || i > 3) {
            throw new Error(`invalid paddle index ${i}`);
        }

        return this._paddles[i];
    }

    getAudio(): Board.Audio {
        return {
            channel0: this._audioOutputStub,
            channel1: this._audioOutputStub
        };
    }

    private _videoEndpointStub: VideoEndpointInterface;
    private _audioOutputStub: AudioOutputInterface;

    private _joysticks = new Array<Joystick>(2);
    private _controlPanel = new ControlPanel();
    private _paddles = new Array<Paddle>(4);
}

export default EmulationContext;
