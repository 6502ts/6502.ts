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

import VideoEndpointInterface from '../../driver/VideoEndpointInterface';
import ControlPanelInterface from '../../../machine/stella/ControlPanelInterface';
import JoystickInterface from '../../../machine/io/DigitalJoystickInterface';
import PaddleInterface from '../../../machine/io/PaddleInterface';
import WaveformAudioOutputInterface from '../../../machine/io/WaveformAudioOutputInterface';
import PCMAudioEndpointInterface from '../../driver/PCMAudioEndpointInterface';
import Config from '../../../machine/stella/Config';
import AsyncIOInterface from '../../../machine/io/AsyncIOInterface';
interface EmulationContextInterface {
    getConfig(): Config;

    getVideo(): VideoEndpointInterface;

    getJoystick(i: number): JoystickInterface;

    getControlPanel(): ControlPanelInterface;

    getPaddle(i: number): PaddleInterface;

    getWaveformChannels(): Array<WaveformAudioOutputInterface>;

    getPCMChannel(): PCMAudioEndpointInterface;

    getAsyncIO(): AsyncIOInterface | undefined;
}

export default EmulationContextInterface;
