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
