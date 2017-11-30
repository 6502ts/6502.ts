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

class CommandInterpreter {
    constructor(commandTable?: CommandInterpreter.CommandTableInterface) {
        if (typeof commandTable !== 'undefined') {
            this.registerCommands(commandTable);
        }
    }

    public registerCommands(commandTable: CommandInterpreter.CommandTableInterface) {
        Object.keys(commandTable).forEach((command: string) => (this._commandTable[command] = commandTable[command]));
    }

    public async execute(cmd: string): Promise<string> {
        cmd = cmd.replace(/;.*/, '');
        if (cmd.match(/^\s*$/)) {
            return '';
        }

        const components = cmd.split(/\s+/).filter((value: string): boolean => !!value),
            commandName = components.shift();

        return await this._locateCommand(commandName).call(this, components, cmd);
    }

    public getCommands(): Array<string> {
        return Object.keys(this._commandTable);
    }

    private _locateCommand(name: string): CommandInterpreter.CommandInterface {
        if (this._commandTable[name]) {
            return this._commandTable[name];
        }

        if (this._aliasTable[name]) {
            return this._aliasTable[name];
        }

        const candidates = Object.keys(this._commandTable).filter((candidate: string) => candidate.indexOf(name) === 0);
        const nCandidates = candidates.length;

        if (nCandidates > 1) {
            throw new Error(
                'ambiguous command ' + name + ', candidates are ' + candidates.join(', ').replace(/, $/, '')
            );
        }

        if (nCandidates === 0) {
            throw new Error('invalid command ' + name);
        }

        return (this._aliasTable[name] = this._commandTable[candidates[0]]);
    }

    private _commandTable: CommandInterpreter.CommandTableInterface = {};
    private _aliasTable: CommandInterpreter.CommandTableInterface = {};
}

namespace CommandInterpreter {
    export interface CommandInterface {
        (args?: Array<string>, cmdString?: string): string | Promise<string>;
    }

    export interface CommandTableInterface {
        [command: string]: CommandInterface;
    }
}

export default CommandInterpreter;
