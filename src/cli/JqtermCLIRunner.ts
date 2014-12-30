/// <reference path="../interface/jquery.terminal.d.ts"/>
/// <reference path="../../typings/jquery/jquery.d.ts"/>

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

        this._cli.on('outputAvailable', (): void => this._onCLIOutputAvailable());
        this._cli.on('promptChanged', (): void => this._onCLIPromptChanged());

        if (options.interruptButton)
            options.interruptButton.mousedown((): void => this._cli.interrupt());

        if (options.clearButton)
            options.clearButton.mousedown((): void => this._terminal.clear());
    }

    startup() {
        this._cli.startup();
        this._terminal.set_prompt(this._cli.getPrompt());
    }

    private _onCLIOutputAvailable(): void {
        this._terminal.echo(this._cli.readOutput());
    }

    private _onCLIPromptChanged(): void {
        this._terminal.set_prompt(this._cli.getPrompt());
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
