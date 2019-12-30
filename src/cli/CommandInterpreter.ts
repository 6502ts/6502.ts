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

export { CommandInterpreter as default };
