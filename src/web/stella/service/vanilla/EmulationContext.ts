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

import EmulationContextInterface from '../EmulationContextInterface';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import Board from '../../../../machine/stella/Board';
import Config from '../../../../machine/stella/Config';
import VideoEndpoint from '../../../driver/VideoEndpoint';
import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import VideoOutputInterface from '../../../../machine/io/VideoOutputInterface';
import WaveformAudioOutputInterface from '../../../../machine/io/WaveformAudioOutputInterface';
import PCMAudioEndpointInterface from '../../../driver/PCMAudioEndpointInterface';
import PCMAudioEndpoint from '../../../driver/PCMAudioEndpoint';
import { ProcessorConfig as VideoProcessorConfig } from '../../../../video/processing/config';
import AsyncIOInterface from '../../../../machine/io/AsyncIOInterface';

export default class EmulationContext implements EmulationContextInterface {
    constructor(
        private _board: Board,
        private _asyncIO?: AsyncIOInterface,
        private _videoProcessing?: Array<VideoProcessorConfig>
    ) {}

    getConfig(): Config {
        return this._board.getConfig();
    }

    getVideo(): VideoEndpointInterface {
        if (!this._videoEndpoint) {
            this._videoEndpoint = new VideoEndpoint(this._board.getVideoOutput(), this._videoProcessing);
        }

        return this._videoEndpoint;
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

    getWaveformChannels(): Array<WaveformAudioOutputInterface> {
        return this._board.getWaveformChannels();
    }

    getPCMChannel(): PCMAudioEndpointInterface {
        if (!this._audioEndpoint) {
            this._audioEndpoint = new PCMAudioEndpoint(this._board.getPCMChannel());
        }

        return this._audioEndpoint;
    }

    getRawVideo(): VideoOutputInterface {
        if (this._videoEndpoint) {
            throw new Error(`video endpoint already initialized; raw video unavailable`);
        }

        return this._board.getVideoOutput();
    }

    getAsyncIO(): AsyncIOInterface {
        return this._asyncIO;
    }

    private _videoEndpoint: VideoEndpoint = null;
    private _audioEndpoint: PCMAudioEndpointInterface = null;
}
