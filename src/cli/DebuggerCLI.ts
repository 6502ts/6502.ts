/// <reference path="../../typings/node/node.d.ts"/>

'use strict';

import path = require('path');

import Debugger = require('../machine/Debugger');
import DebuggerFrontend = require('./DebuggerFrontend');
import CommandInterpreter = require('./CommandInterpreter');
import CLIInterface = require('./CLIInterface');
import AbstractCLI = require('./AbstractCLI');
import FilesystemProviderInterface = require('../fs/FilesystemProviderInterface');

import Board = require('../machine/vanilla/Board');

class DebuggerCLI extends AbstractCLI implements CLIInterface {

    constructor(private _fsProvider: FilesystemProviderInterface) {
        super();

        var board = new Board(),
            dbg = new Debugger(),
            commandInterpreter = new CommandInterpreter(),
            debuggerFrontend = new  DebuggerFrontend(dbg, this._fsProvider, commandInterpreter);

        dbg.attach(board);

        commandInterpreter.registerCommands({
            quit: (): string => {
                this._quit();
                return 'bye';
            },
            'run-script': (args: Array<string>): string => {
                if (!args.length) throw new Error('filename required');
                this.runDebuggerScript(args[0]);
                return 'script executed';
            }
        });

        this._board = board;
        this._commandInterpreter = commandInterpreter;
    }

    runDebuggerScript(filename: string): void {
        this._fsProvider.pushd(path.dirname(filename));

        try {
            this._fsProvider.readTextFileSync(path.basename(filename))
                .split('\n')
                .forEach((line: string): void => {
                    this.pushInput(line);
                });
        } catch (e) {
            this._fsProvider.popd();
            throw e;
        }

        this._fsProvider.popd();
    }

    startup(): void {
        this._prompt();
    }

    shutdown(): void {}

    pushInput(input: string): void {
        try {
            this._outputLine(this._commandInterpreter.execute(input));
        } catch (e) {
            this._outputLine('ERROR: ' + e.message);
        }
    }

    interrupt(): void {
        this._quit();
    }

    outputAvailable(): boolean {
        return !!this._output;
    }

    readOutput(): string {
        var output = this._output;

        this._output = '';
        
        return output;
    }

    availableCommands(): Array<string> {
        return this._commandInterpreter.getCommands();
    }

    getPrompt(): string {
        return '> ';
    }

    getFilesystemProvider(): FilesystemProviderInterface {
        return this._fsProvider;
    }

    allowQuit(allowQuit: boolean): void {
        this._allowQuit = allowQuit;
    }

    private _prompt(): void {
        this.events.prompt.dispatch(undefined);
    }

    private _quit(): void {
        if (this._allowQuit) this.events.quit.dispatch(undefined);
    }

    private _outputLine(line: string): void {
        this._output += (line + '\n');
        this.events.outputAvailable.dispatch(undefined);
    }

    private _board: Board;
    private _commandInterpreter: CommandInterpreter;

    private _output = '';
    private _allowQuit = true;
}

export = DebuggerCLI;
