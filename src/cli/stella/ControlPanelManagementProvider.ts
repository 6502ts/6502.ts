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
            this._changeDifficultySwitch(this._controlPanel.getDifficultySwitchP1(), 1, args),
    };

}

export default CotrolPanelManagementProvider;
