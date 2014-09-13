/// <reference path="./CLIInterface.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>

'use strict';

import readline = require('readline');

class NodeCLIRunner {
    constructor(
        private _cli: CLIInterface
    ) {
        this._availableCommands = this._cli.availableCommands();

        this._readline = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: (cmd: string): Array<any> =>
                [this._availableCommands.filter(
                    (candidate: string) => candidate.search(cmd) === 0
                ), cmd]
        });

        this._readline.on('line', (data: string) => this._cli.pushInput(data));
        this._readline.on('SIGINT', () => this._cli.interrupt());

        this._cli.on('outputAvailable',     () => this._onCLIOutputAvailable());
        this._cli.on('promptChanged',       () => this._onCLIPromptChanged());
        this._cli.on('quit',                () => this._onCLIQuit());
        this._cli.on('prompt',              () => this._onCLIPrompt());
    }

    startup(): void {
        this._cli.startup();

        var prompt = this._cli.getPrompt();
        this._readline.setPrompt(prompt, prompt.length);

        this._readline.prompt();
    }

    private _onCLIQuit(): void {
        this._closed = true;
        this._cli.shutdown()
        this._readline.close();
    }

    private _onCLIOutputAvailable(): void {
        if (this._closed) return;

        var output = this._cli.readOutput();
        process.stdout.write(output);
    }

    private _onCLIPromptChanged() {
        if (this._closed) return;

        var prompt = this._cli.getPrompt();
        this._readline.setPrompt(prompt, prompt.length);
    }

    private _onCLIPrompt() {
        if (this._closed) return;

        this._readline.prompt();
    }

    private _closed = false;
    private _readline: readline.ReadLine;
    private _availableCommands: Array<string>;
}

export = NodeCLIRunner;
