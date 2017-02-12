/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';
import {ProcessorConfig as VideoProcessorConfig} from '../../../../video/processing/config';

export const RPC_TYPE = {
    emulationPause: 'emulation/pause',
    emulationReset: 'emulation/reset',
    emulationResume: 'emulation/resume',
    emulationSetRateLimit: 'emulation/setRateLimit',
    emulationStart: 'emulation/start',
    emulationStop: 'emulation/stop',
    emulationGetParameters: 'emulation/getParameters',
    emulationFetchLastError: 'emulation/fetchLastError',
    setup: '/setup'
};
Object.freeze(RPC_TYPE);

export const SIGNAL_TYPE = {
    emulationError: 'emulation/error',
    emulationFrequencyUpdate: 'emulation/frequencyUpdate',
    videoNewFrame: 'video/newFrame',
    videoReturnSurface: 'video/returnSurface',
    controlStateUpdate: 'control/stateUpdate',
    audioVolumeChange: 'audio/volumeChange',
    audioBufferChange: 'audio/bufferChange',
    audioStop: 'audio/stop'
};
Object.freeze(SIGNAL_TYPE);

export interface SetupMessage {
    videoProcessorPort: MessagePort;
}

export interface EmulationStartMessage {
    buffer: {[i: number]: number, length: number};
    config: StellaConfig;
    cartridgeType?: CartridgeInfo.CartridgeType;
    videoProcessing?: Array<VideoProcessorConfig>;
};

export interface EmulationParametersResponse {
    width: number;
    height: number;
    volume: Array<number>;
};

export interface VideoNewFrameMessage {
    id: number;
    width: number;
    height: number;
    buffer: ArrayBuffer;
}

export interface VideoReturnSurfaceMessage {
    id: number;
    buffer: ArrayBuffer;
}

export interface AudioVolumeChangeMessage {
    index: number;
    value: number;
}

export interface AudioBufferChangeMessage {
    index: number;
    key: number;
}