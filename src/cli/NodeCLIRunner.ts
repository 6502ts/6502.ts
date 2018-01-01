/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import * as readline from 'readline';
import CLIInterface from './CLIInterface';
import Completer from './Completer';

class NodeCLIRunner {
    constructor(private _cli: CLIInterface) {
        this._updateCompleter();

        this._readline = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: (cmd: string): any => {
                const result = this._completer.complete(cmd);
                return [result.candidates, result.match];
            }
        });

        this._readline.on('line', (data: string) => this._cli.pushInput(data));
        this._readline.on('SIGINT', () => this._cli.interrupt());

        this._cli.events.outputAvailable.addHandler(this._onCLIOutputAvailable, this);
        this._cli.events.promptChanged.addHandler(this._onCLIPromptChanged, this);
        this._cli.events.quit.addHandler(this._onCLIQuit, this);
        this._cli.events.prompt.addHandler(this._onCLIPrompt, this);
        this._cli.events.availableCommandsChanged.addHandler(this._updateCompleter.bind(this));
    }

    startup(): void {
        this._cli.startup();

        const prompt = this._cli.getPrompt();
        this._readline.setPrompt(prompt);

        this._readline.prompt();
    }

    private _onCLIQuit(payload: void, ctx: NodeCLIRunner): void {
        ctx._closed = true;
        ctx._cli.shutdown();
        ctx._readline.close();
    }

    private _onCLIOutputAvailable(payload: void, ctx: NodeCLIRunner): void {
        if (ctx._closed) {
            return;
        }

        const output = ctx._cli.readOutput();
        process.stdout.write(output);

        ctx._readline.prompt();
    }

    private _onCLIPromptChanged(payload: void, ctx: NodeCLIRunner) {
        if (ctx._closed) {
            return;
        }

        const prompt = ctx._cli.getPrompt();
        ctx._readline.setPrompt(prompt);
    }

    private _onCLIPrompt(payload: void, ctx: NodeCLIRunner) {
        if (ctx._closed) {
            return;
        }

        ctx._readline.prompt();
    }

    private _updateCompleter() {
        this._completer = new Completer(this._cli.availableCommands(), this._cli.getFilesystemProvider());
    }

    private _closed = false;
    private _readline: readline.ReadLine;
    private _completer: Completer;
}

export { NodeCLIRunner as default };
