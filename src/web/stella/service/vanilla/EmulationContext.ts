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

import EmulationContextInterface from '../EmulationContextInterface';
import ControlPanelInterface from '../../../../machine/stella/ControlPanelInterface';
import JoystickInterface from '../../../../machine/io/DigitalJoystickInterface';
import PaddleInterface from '../../../../machine/io/PaddleInterface';
import Board from '../../../../machine/stella/Board';
import VideoEndpoint from '../../../driver/VideoEndpoint';
import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import VideoOutputInterface from '../../../../machine/io/VideoOutputInterface';
import {ProcessorConfig as VideoProcessorConfig} from '../../../../video/processing/config';

export default class EmulationContext implements EmulationContextInterface {

    constructor(
        private _board: Board,
        private _videoProcessing?: Array<VideoProcessorConfig>
    ) {}

    getVideo(): VideoEndpointInterface {
        if (!this._videoEndpoint) {
            this._videoEndpoint = new VideoEndpoint(
                this._board.getVideoOutput(),
                this._videoProcessing
            );
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

    getAudio(): Board.Audio {
        return this._board.getAudioOutput();
    }

    getRawVideo(): VideoOutputInterface {
        if (this._videoEndpoint) {
            throw new Error(`video endpoint already initialized; raw video unavailable`);
        }

        return this._board.getVideoOutput();
    }

    private _videoEndpoint: VideoEndpoint = null;

}
