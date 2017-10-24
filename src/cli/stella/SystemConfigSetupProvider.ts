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

import Config from '../../machine/stella/Config';
import CommandInterpreter from '../CommandInterpreter';

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
        pcm: this._setupPcmAUdio.bind(this)
    };
}
