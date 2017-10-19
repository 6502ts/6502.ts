/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import WaveformAudioOutputInterface from '../../../../machine/io/WaveformAudioOutputInterface';
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
        channel0: WaveformAudioOutputInterface;
        channel1: WaveformAudioOutputInterface;
    };
}

export default EmulationContext;
