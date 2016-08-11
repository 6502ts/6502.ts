import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import AudioOutputInterface from '../../../../machine/io/AudioOutputInterface';
import AudioOutputBuffer from '../../../../tools/AudioOutputBuffer';
import Board from '../../../../machine/stella/Board';

import EmulationContextInterface from '../EmulationContextInterface';
import Event from '../../../../tools/event/Event';
import VideoProxy from './VideoProxy';
import ControlProxy from './ControlProxy';

class EmulationContext implements EmulationContextInterface {

    constructor(
        private _videoProxy: VideoProxy,
        private _controlProxy: ControlProxy
    ) {
        const audioBufferStub = new AudioOutputBuffer(new Float32Array([0]), 44100);

        this._audioOutputStub = {
            bufferChanged: new Event<number>(),
            volumeChanged: new Event<number>(),
            stop: new Event<void>(),
            getBuffer: () => audioBufferStub,
            getVolume: () => 0
        };

        this._videoProxy.newFrame.addHandler(() => this._controlProxy.sendUpdate());
    }

    getVideo(): VideoEndpointInterface {
        return this._videoProxy;
    }

    getJoystick(i: number): JoystickInterface {
        return this._controlProxy.getJoystick(i);
    }

    getControlPanel(): ControlPanelInterface {
        return this._controlProxy.getControlPanel();
    }

    getPaddle(i: number): PaddleInterface {
        return this._controlProxy.getPaddle(i);
    }

    getAudio(): Board.Audio {
        return {
            channel0: this._audioOutputStub,
            channel1: this._audioOutputStub
        };
    }

    getVideoProxy(): VideoProxy {
        return this._videoProxy;
    }

    private _audioOutputStub: AudioOutputInterface;
}

export default EmulationContext;
