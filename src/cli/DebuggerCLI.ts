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
import BoardInterface = require('../machine/board/BoardInterface');

class DebuggerCLI extends AbstractCLI implements CLIInterface {

    constructor(fsProvider: FilesystemProviderInterface) {
        super();

        this._fsProvider = fsProvider;
        this._initializeHardware();

        var dbg = new Debugger(),
            commandInterpreter = new CommandInterpreter(),
            debuggerFrontend = new  DebuggerFrontend(dbg, this._fsProvider, commandInterpreter);

        dbg.attach(this._board);

        this._commandInterpreter = commandInterpreter;

        this._extendCommandInterpreter();
    }

    protected _initializeHardware(): void {
        this._board = new Board();
    }

    protected _extendCommandInterpreter(): void {
        this._commandInterpreter.registerCommands({
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

    protected _prompt(): void {
        this.events.prompt.dispatch(undefined);
    }

    protected _quit(): void {
        if (this._allowQuit) this.events.quit.dispatch(undefined);
    }

    protected _outputLine(line: string): void {
        this._output += (line + '\n');
        this.events.outputAvailable.dispatch(undefined);
    }

    protected _board: BoardInterface;
    protected _commandInterpreter: CommandInterpreter;

    protected _output = '';
    protected _allowQuit = true;

    protected _fsProvider: FilesystemProviderInterface;
}

export = DebuggerCLI;
