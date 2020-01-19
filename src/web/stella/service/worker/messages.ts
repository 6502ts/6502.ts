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

import EventServiceInterface from '../EmulationServiceInterface';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';
import { ProcessorConfig as VideoProcessorConfig } from '../../../../video/processing/config';

export const RPC_TYPE = {
    emulationPause: 'emulation/pause',
    emulationReset: 'emulation/reset',
    emulationResume: 'emulation/resume',
    emulationSetRateLimit: 'emulation/setRateLimit',
    emulationStart: 'emulation/start',
    emulationStop: 'emulation/stop',
    emulationFetchLastError: 'emulation/fetchLastError',
    getVideoParameters: 'video/getParameters',
    getWaveformAudioParameters: (index: number) => `audio/waveform/getParameters/${index}`,
    getPCMAudioParameters: (index: number) => `audio/pcm/getParameters/${index}`,
    setup: '/setup'
};
Object.freeze(RPC_TYPE);

export const SIGNAL_TYPE = {
    emulationError: 'emulation/error',
    emulationFrequencyUpdate: 'emulation/frequencyUpdate',
    videoNewFrame: 'video/newFrame',
    videoReturnSurface: 'video/returnSurface',
    controlStateUpdate: 'control/stateUpdate',
    waveformAudioVolumeChange: 'audio/waveform/volumeChange',
    waveformAudioBufferChange: 'audio/waveform/bufferChange',
    pcmAudioNewFrame: (index: number) => `audio/pcm/newFrame/${index}`,
    pcmAudioTogglePause: (index: number) => `audio/pcm/togglePause/${index}`,
    pcmAudioReturnFrame: (index: number) => `audio/pcm/returnFrame/${index}`,
    audioStop: 'audio/stop',
    messageFromDataTap: 'data-tap/message'
};
Object.freeze(SIGNAL_TYPE);

export interface SetupMessage {
    videoProcessorPort: MessagePort;
}

export interface EmulationStartMessage {
    buffer: { [i: number]: number; length: number };
    config: EventServiceInterface.Config;
    cartridgeType?: CartridgeInfo.CartridgeType;
    videoProcessing?: Array<VideoProcessorConfig>;
}

export interface VideoParametersResponse {
    width: number;
    height: number;
}

export interface WaveformAudioParametersResponse {
    volume: number;
}

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

export interface WaveformAudioVolumeChangeMessage {
    index: number;
    value: number;
}

export interface WaveformAudioBufferChangeMessage {
    index: number;
    key: number;
}

export interface PCMAudioParametersResponse {
    sampleRate: number;
    frameSize: number;
    paused: boolean;
}

export interface PCMAudioNewFrameMessage {
    buffer: ArrayBuffer;
    id: number;
}

export interface PCMAudioTogglePauseMessage {
    paused: boolean;
}

export interface PCMAudioReturnFrameMessage {
    id: number;
    buffer: ArrayBuffer;
}

export type MessageFromDataTapMessage = Array<number>;
