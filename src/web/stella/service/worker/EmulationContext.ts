/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import WaveformAudioOutputInterface from '../../../../machine/io/WaveformAudioOutputInterface';
import PCMAudioEndpointInterface from '../../../driver/PCMAudioEndpointInterface';
import Config from '../../../../machine/stella/Config';

import EmulationContextInterface from '../EmulationContextInterface';
import VideoProxy from './VideoProxy';
import ControlProxy from './ControlProxy';
import WaveformAudioProxy from './WaveformAudioProxy';
import PCMAudioProxy from './PCMAudioProxy';
import DataTapProxy from './DataTapProxy';

class EmulationContext implements EmulationContextInterface {
    constructor(
        private _videoProxy: VideoProxy,
        private _controlProxy: ControlProxy,
        private _waveformChannels: Array<WaveformAudioProxy>,
        private _pcmChannel: PCMAudioProxy,
        private _dataTapProxy: DataTapProxy
    ) {
        if (this._waveformChannels.length !== 2) {
            throw new Error(`invalid channel count ${this._waveformChannels.length}`);
        }
    }

    setConfig(config: Config): void {
        this._config = config;
    }

    getConfig(): Config {
        return this._config;
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

    getWaveformChannels(): Array<WaveformAudioOutputInterface> {
        return this._waveformChannels;
    }

    getPCMChannel(): PCMAudioEndpointInterface {
        return this._pcmChannel;
    }

    getVideoProxy(): VideoProxy {
        return this._videoProxy;
    }

    getDataTap(): DataTapProxy {
        return this._dataTapProxy;
    }

    private _config: Config = null;
}

export { EmulationContext as default };
