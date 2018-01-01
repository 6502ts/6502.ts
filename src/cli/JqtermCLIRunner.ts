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

import CLIInterface from './CLIInterface';
import Completer from './Completer';

class JqtermCLIRunner {
    constructor(private _cli: CLIInterface, terminalElt: JQuery, options: JqtermCLIRunner.Options = {}) {
        this._updateCompleter();

        this._terminal = terminalElt.terminal(
            (input: string, terminal: JQueryTerminal): void => this._cli.pushInput(input),
            {
                greetings: 'Ready.',
                completion: this._getCompletionHandler(),
                exit: false,
                clear: false
            }
        );

        this._cli.events.outputAvailable.addHandler(this._onCLIOutputAvailable, this);
        this._cli.events.promptChanged.addHandler(this._onCLIPromptChanged, this);
        this._cli.events.availableCommandsChanged.addHandler(this._updateCompleter.bind(this));

        if (options.interruptButton) {
            options.interruptButton.mousedown((): void => this._cli.interrupt());
        }

        if (options.clearButton) {
            options.clearButton.mousedown((): void => this._terminal.clear());
        }
    }

    startup() {
        this._cli.startup();
        this._terminal.set_prompt(this._cli.getPrompt());
    }

    private _updateCompleter() {
        this._completer = new Completer(this._cli.availableCommands(), this._cli.getFilesystemProvider());
    }

    private _onCLIOutputAvailable(payload: void, ctx: JqtermCLIRunner): void {
        ctx._terminal.echo(ctx._cli.readOutput());
    }

    private _onCLIPromptChanged(payload: void, ctx: JqtermCLIRunner): void {
        ctx._terminal.set_prompt(ctx._cli.getPrompt());
    }

    private _getCompletionHandler() {
        const me = this;

        return function(this: JQueryTerminal, cmd: string, handler: (candidates: Array<string>) => void) {
            handler(me._completer.complete(this.get_command()).candidates);
        };
    }

    private _terminal: JQueryTerminal;
    private _completer: Completer;
}

namespace JqtermCLIRunner {
    export interface Options {
        interruptButton?: JQuery;
        clearButton?: JQuery;
    }
}

export { JqtermCLIRunner as default };
