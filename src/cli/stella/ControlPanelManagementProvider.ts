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

import ControlPanelInterface from '../../machine/stella/ControlPanelInterface';
import CommandInterpreter from '../CommandInterpreter';
import SwitchInterface from '../../machine/io/SwitchInterface';

class CotrolPanelManagementProvider {
    constructor(protected _controlPanel: ControlPanelInterface) {}

    getCommands(): CommandInterpreter.CommandTableInterface {
        return this._commands;
    }

    protected _changeColorSwitch(args?: Array<string>) {
        const swtch = this._controlPanel.getColorSwitch();

        if (args && args.length > 0) {
            switch (args[0].toLowerCase()) {
                case '1':
                case 'on':
                case 'bw':
                    swtch.toggle(true);
                    break;

                case '0':
                case 'off':
                case 'color':
                    swtch.toggle(false);
                    break;

                default:
                    throw new Error(`invalid switch state '${args[0]}'`);
            }
        }

        return `color switch: ${swtch.read() ? 'BW' : 'color'}`;
    }

    protected _changeDifficultySwitch(swtch: SwitchInterface, playerId: number, args?: Array<string>) {
        if (args && args.length > 0) {
            switch (args[0].toLowerCase()) {
                case '1':
                case 'on':
                case 'b':
                case 'amateur':
                    swtch.toggle(true);
                    break;

                case '0':
                case 'off':
                case 'a':
                case 'pro':
                    swtch.toggle(false);
                    break;

                default:
                    throw new Error(`invalid switch state '${args[0]}'`);
            }
        }

        return `player ${playerId} difficulty switch: ${swtch.read() ? 'amateur' : 'pro'}`;
    }

    protected _commands: CommandInterpreter.CommandTableInterface = {
        'switch-color': this._changeColorSwitch.bind(this),
        'switch-difficulty-player-0': (args?: Array<string>) =>
            this._changeDifficultySwitch(this._controlPanel.getDifficultySwitchP0(), 0, args),
        'switch-difficulty-player-1': (args?: Array<string>) =>
            this._changeDifficultySwitch(this._controlPanel.getDifficultySwitchP1(), 1, args)
    };
}

export { CotrolPanelManagementProvider as default };
