import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import AudioOutputInterface from '../../../../machine/io/AudioOutputInterface';
import Board from '../../../../machine/stella/Board';

import EmulationContextInterface from '../EmulationContextInterface';
import VideoProxy from './VideoProxy';
import ControlProxy from './ControlProxy';
import AudioProxy from './AudioProxy';

class EmulationContext implements EmulationContextInterface {

    constructor(
        private _videoProxy: VideoProxy,
        private _controlProxy: ControlProxy,
        audioChannels: Array<AudioProxy>
    ) {
        if (audioChannels.length !== 2) {
            throw new Error(`invalid channel count ${audioChannels.length}`);
        }

        this._audioChannels = {
            channel0: audioChannels[0],
            channel1: audioChannels[1]
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
        return this._audioChannels;
    }

    getVideoProxy(): VideoProxy {
        return this._videoProxy;
    }

    private _audioChannels: {
        channel0: AudioOutputInterface;
        channel1: AudioOutputInterface;
    };
}

export default EmulationContext;
