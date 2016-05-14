/// <reference path="../interface/jquery.terminal.d.ts"/>

'use strict';

import CLIInterface = require('./CLIInterface');
import Completer = require('./Completer');

class JqtermCLIRunner {
    constructor(
        private _cli: CLIInterface,
        terminalElt: JQuery,
        options: JqtermCLIRunner.Options = {}
    ) {
        this._completer = new Completer(
            this._cli.availableCommands(), this._cli.getFilesystemProvider());

        this._terminal = terminalElt.terminal(
            (input: string, terminal: JQueryTerminal): void =>
                this._cli.pushInput(input),
            {
                greetings: 'Ready.',
                completion: (terminal: JQueryTerminal, cmd: string,
                        handler: (candidates: Array<string>) => void
                    ) => handler(this._completer.complete(terminal.get_command()).candidates),
                exit: false,
                clear: false
            }
        );

        this._cli.events.outputAvailable.addHandler(this._onCLIOutputAvailable, this);
        this._cli.events.promptChanged.addHandler(this._onCLIPromptChanged, this);

        if (options.interruptButton)
            options.interruptButton.mousedown((): void => this._cli.interrupt());

        if (options.clearButton)
            options.clearButton.mousedown((): void => this._terminal.clear());
    }

    startup() {
        this._cli.startup();
        this._terminal.set_prompt(this._cli.getPrompt());
    }

    private _onCLIOutputAvailable(payload: void, ctx: JqtermCLIRunner): void {
        ctx._terminal.echo(ctx._cli.readOutput());
    }

    private _onCLIPromptChanged(payload: void, ctx: JqtermCLIRunner): void {
        ctx._terminal.set_prompt(ctx._cli.getPrompt());
    }

    private _terminal: JQueryTerminal;
    private _completer: Completer;
}

module JqtermCLIRunner {
    export interface Options {
        interruptButton?: JQuery
        clearButton?: JQuery
    }
}

export = JqtermCLIRunner;
