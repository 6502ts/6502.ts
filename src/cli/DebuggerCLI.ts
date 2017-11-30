/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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

import * as path from 'path';

import Debugger from '../machine/Debugger';
import DebuggerFrontend from './DebuggerFrontend';
import CommandInterpreter from './CommandInterpreter';
import CLIInterface from './CLIInterface';
import AbstractCLI from './AbstractCLI';
import FilesystemProviderInterface from '../fs/FilesystemProviderInterface';

import Board from '../machine/vanilla/Board';
import BoardInterface from '../machine/board/BoardInterface';

class DebuggerCLI extends AbstractCLI implements CLIInterface {
    constructor(protected _fsProvider: FilesystemProviderInterface) {
        super();

        const dbg = new Debugger(),
            commandInterpreter = new CommandInterpreter(),
            debuggerFrontend = new DebuggerFrontend(dbg, this._fsProvider, commandInterpreter);

        this._debugger = dbg;
        this._commandInterpreter = commandInterpreter;
        this._extendCommandInterpreter();
        this._debuggerFrontend = debuggerFrontend;
    }

    async runDebuggerScript(filename: string): Promise<void> {
        this._fsProvider.pushd(path.dirname(filename));

        try {
            for (const line of this._fsProvider.readTextFileSync(path.basename(filename)).split('\n')) {
                await this.pushInput(line);
            }
        } catch (e) {
            this._fsProvider.popd();
            throw e;
        }

        this._fsProvider.popd();
    }

    startup(): void {
        this._initialize();
        this._prompt();
    }

    shutdown(): void {}

    async pushInput(input: string): Promise<void> {
        try {
            this._outputLine(await this._getCommandInterpreter().execute(input));
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
        const output = this._output;

        this._output = '';

        return output;
    }

    availableCommands(): Array<string> {
        return this._getCommandInterpreter().getCommands();
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

    protected _initialize() {
        this._initializeHardware();
        this._debugger.attach(this._board);
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
            'run-script': async (args: Array<string>): Promise<string> => {
                if (!args.length) {
                    throw new Error('filename required');
                }

                await this.runDebuggerScript(args[0]);
                return 'script executed';
            }
        });
    }

    protected _prompt(): void {
        this.events.prompt.dispatch(undefined);
    }

    protected _quit(): void {
        if (this._allowQuit) {
            this.events.quit.dispatch(undefined);
        }
    }

    protected _outputLine(line: string): void {
        this._output += line + '\n';
        this.events.outputAvailable.dispatch(undefined);
    }

    protected _getCommandInterpreter(): CommandInterpreter {
        return this._commandInterpreter;
    }

    protected _board: BoardInterface;
    protected _commandInterpreter: CommandInterpreter;
    protected _debuggerFrontend: DebuggerFrontend;

    protected _output = '';
    protected _allowQuit = true;

    protected _debugger: Debugger;
}

export default DebuggerCLI;
