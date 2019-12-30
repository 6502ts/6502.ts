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

import CpuFactory from '../cpu/Factory';

interface Config {
    tvMode: Config.TvMode;
    enableAudio: boolean;
    randomSeed: number;
    emulatePaddles: boolean;
    frameStart: number;
    pcmAudio: boolean;
    cpuType: CpuFactory.Type;
}

namespace Config {
    export const enum TvMode {
        ntsc,
        pal,
        secam
    }

    export function create(config: Partial<Config> = {}): Config {
        return {
            tvMode: TvMode.ntsc,
            enableAudio: true,
            randomSeed: -1,
            emulatePaddles: true,
            frameStart: -1,
            pcmAudio: false,
            cpuType: CpuFactory.Type.stateMachine,

            ...config
        };
    }

    export function getClockHz(config: Config): number {
        switch (config.tvMode) {
            case Config.TvMode.ntsc:
                return 262 * 228 * 60;

            case Config.TvMode.pal:
            case Config.TvMode.secam:
                return 312 * 228 * 50;
        }
    }
}

export { Config as default };
