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

import Config from '../../machine/stella/Config';
import CommandInterpreter from '../CommandInterpreter';
import Factory from '../../machine/cpu/Factory';

export default class SystemConfigSetupProvider {
    constructor(private _config: Config) {}

    getCommands(): CommandInterpreter.CommandTableInterface {
        return this._commands;
    }

    protected _setupVideo(args?: Array<string>) {
        if (!args || args.length === 0) {
            return `current TV mode: ${this._humanReadableTvMode(this._config.tvMode)}`;
        }

        switch (args[0].toLowerCase()) {
            case 'ntsc':
                this._config.tvMode = Config.TvMode.ntsc;
                break;

            case 'pal':
                this._config.tvMode = Config.TvMode.pal;
                break;

            case 'secam':
                this._config.tvMode = Config.TvMode.secam;
                break;

            default:
                throw new Error(`invalid TV mode "${args[0]}"`);
        }

        return `switched TV mode to ${this._humanReadableTvMode(this._config.tvMode)}`;
    }

    protected _setupAudio(args?: Array<string>) {
        if (args && args.length !== 0) {
            this._config.enableAudio = this._isArgTruthy(args[0]);
        }

        return `audio ${this._config.enableAudio ? 'enabled' : 'disabled'}`;
    }

    protected _setupPaddles(args?: Array<string>) {
        if (args && args.length !== 0) {
            this._config.emulatePaddles = this._isArgTruthy(args[0]);
        }

        return `paddle emulation: ${this._config.emulatePaddles ? 'enabled' : 'disabled'}`;
    }

    protected _setHighPrecisionCpu(args?: Array<string>) {
        if (args && args.length !== 0) {
            this._config.cpuType = this._isArgTruthy(args[0]) ? Factory.Type.stateMachine : Factory.Type.batchedAccess;
        }

        return `using high precision CPU: ${this._config.cpuType === Factory.Type.stateMachine ? 'yes' : 'no'}`;
    }

    protected _setRandomSeed(args?: Array<string>) {
        if (args && args.length !== 0) {
            this._config.randomSeed = parseInt(args[0], 10);
        }

        return `random seed: ${this._config.randomSeed}`;
    }

    protected _humanReadableTvMode(mode: Config.TvMode) {
        switch (mode) {
            case Config.TvMode.ntsc:
                return 'NTSC';

            case Config.TvMode.pal:
                return 'PAL';

            case Config.TvMode.secam:
                return 'SECAM';

            default:
                throw new Error(`invalid TV mode ${mode}`);
        }
    }

    protected _setupPcmAUdio(args?: Array<string>) {
        if (args && args.length !== 0) {
            this._config.pcmAudio = this._isArgTruthy(args[0]);
        }

        return `PCM audio emulation: ${this._config.emulatePaddles ? 'enabled' : 'disabled'}`;
    }

    protected _isArgTruthy(arg: string): boolean {
        const normalizedArg = arg.toLocaleLowerCase();

        return normalizedArg === 'yes' || normalizedArg === 'true' || normalizedArg === '1';
    }

    _commands: CommandInterpreter.CommandTableInterface = {
        'tv-mode': this._setupVideo.bind(this),
        audio: this._setupAudio.bind(this),
        paddles: this._setupPaddles.bind(this),
        seed: this._setRandomSeed.bind(this),
        pcm: this._setupPcmAUdio.bind(this),
        'high-precision-cpu': this._setHighPrecisionCpu.bind(this)
    };
}
