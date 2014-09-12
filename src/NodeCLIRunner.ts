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
        this._readline.on('SIGINT', () => this._cli.interrupt);

        this._cli.on('outputAvailable', this._onCLIOutputAvailable.bind(this));
        this._cli.on('changePrompt', this._onCLIChangePrompt.bind(this));
        this._cli.on('quit', this._onCLIQuit.bind(this));
    }

    startup(): void {
        this._cli.startup();
        this._readline.prompt();
    }

    private _onCLIQuit(): void {
        this._closed = true;
        this._readline.close();
    }

    private _onCLIOutputAvailable(): void {
        if (this._closed) return;

        console.log(this._cli.readOutput());
        this._readline.prompt();
    }

    private _onCLIChangePrompt(prompt: string) {
        if (this._closed) return;

        this._readline.setPrompt(prompt, prompt.length);
    }

    private _closed = false;
    private _readline: readline.ReadLine;
    private _availableCommands: Array<string>;
}

export = NodeCLIRunner;
