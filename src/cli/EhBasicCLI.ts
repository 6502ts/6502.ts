/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

import Board from '../machine/ehbasic/Board';
import BoardInterface from '../machine/board/BoardInterface';

import Debugger from '../machine/Debugger';
import DebuggerFrontend from './DebuggerFrontend';
import CommandInterpreter from './CommandInterpreter';
import CLIInterface from './CLIInterface';
import AbstractCLI from './AbstractCLI';
import FileSystemProviderInterface from '../fs/FilesystemProviderInterface';

import SchedulerInterface from '../tools/scheduler/SchedulerInterface';
import ImmediateScheduler from '../tools/scheduler/ImmedateScheduler';
import PeriodicScheduler from '../tools/scheduler/PeriodicScheduler';
import TaskInterface from '../tools/scheduler/TaskInterface';

import ClockProbe from '../tools/ClockProbe';

const enum State {
    debug, run, quit
}

const OUTPUT_FLUSH_INTERVAL = 100;
const CLOCK_PROBE_INTERVAL = 1000;

class EhBasicCLI extends AbstractCLI implements CLIInterface {
    constructor(
            private _fsProvider: FileSystemProviderInterface
    ) {
        super();

        const board = new Board(),
            dbg = new Debugger(),
            commandInterpreter = new CommandInterpreter(),
            debuggerFrontend = new  DebuggerFrontend(dbg, this._fsProvider, commandInterpreter),
            clockProbe = new ClockProbe(new PeriodicScheduler(CLOCK_PROBE_INTERVAL));

        dbg.attach(board);

        clockProbe.attach(board.cpuClock);
        clockProbe.frequencyUpdate.addHandler(() => this.events.promptChanged.dispatch(undefined));

        board.trap.addHandler(this._onTrap, this);

        commandInterpreter.registerCommands({
            quit: (): string => {
                if (this._allowQuit) this._setState(State.quit);
                return 'bye';
            },
            run: (): string => {
                this._setState(State.run);
                return 'running, press ctl-c to interrupt...';
            },
            input: (args: Array<string>, cmd: string): string => {
                const data = cmd.replace(/^\s*input\s*/, '').replace(/\\n/, '\n'),
                    length = data.length;

                for (let i = 0; i < length; i++)
                    this._inputBuffer.push(data[i] === '\n' ? 0x0D : data.charCodeAt(i) & 0xFF);
                return '';
            },
            'run-script': (args: Array<string>): string => {
                if (!args.length) throw new Error('filename required');
                this.runDebuggerScript(args[0]);
                return 'script executed';
            },
            'read-program': (args: Array<string>): string => {
                if (!args.length) throw new Error('filename required');
                this.readBasicProgram(args[0]);
                return 'program read into buffer';
            }
        });

        board.getSerialIO()
            .setOutCallback((value: number) => this._serialOutHandler(value))
            .setInCallback(() => this._serialInHandler());

        this._commands = commandInterpreter.getCommands();
        this._board = board;
        this._commandInterpreter = commandInterpreter;
        this._scheduler = new ImmediateScheduler();
        this._clockProbe = clockProbe;
        this._debuggerFrontend = debuggerFrontend;
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

    readBasicProgram(filename: string): void {
        this._fsProvider.readTextFileSync(filename)
            .split('\n')
            .forEach((line: string): void => {
                let length = line.length;
                for (let i = 0; i < length; i++) {
                    this._inputBuffer.push(line.charCodeAt(i) & 0xFF);
                }
                this._inputBuffer.push(0x0D);
            });
    }

    startup(): void {
        this._setState(State.debug);

        const scheduler = new PeriodicScheduler(OUTPUT_FLUSH_INTERVAL);
        this._flushOutputTask = scheduler.start((cli: EhBasicCLI) => cli._flushOutput(), this);

        this._prompt();
    }

    shutdown(): void {
        if (!this._flushOutputTask) return;
        this._flushOutputTask.stop();
        this._flushOutputTask = undefined;
    }

    readOutput(): string {
        const buffer = this._cliOutputBuffer;
        this._cliOutputBuffer = '';
        return buffer;
    }

    availableCommands(): Array<string> {
        return this._commandInterpreter.getCommands();
    }

    interrupt(): void {
        switch (this._state) {
            case State.run:
                this._setState(State.debug);
                this._prompt();
                break;

            case State.debug:
                if (this._allowQuit) this._setState(State.quit);
                break;
        }
    }

    outputAvailable(): boolean {
        return !!this._cliOutputBuffer;
    }

    pushInput (data: string): void {
        switch (this._state) {
            case State.run:
                const size = data.length;

                for (let i = 0; i < size; i++) {
                    this._inputBuffer.push(data.charCodeAt(i) & 0xFF);
                }
                this._inputBuffer.push(0x0D);
                break;

            case State.debug:
                try {
                    this._outputLine(this._commandInterpreter.execute(data));
                } catch (e) {
                    this._outputLine('ERROR: ' + e.message);
                }
                this._prompt();
                break;
        }
    }

    allowQuit(toggle: boolean): void {
        this._allowQuit = toggle;
    }

    getPrompt(): string {
        let prompt = this._clockProbe.getFrequency() > 0 ?
            (this._clockProbe.getFrequency() / 1000000).toFixed(2) + ' MHz ' : '';

        switch (this._state) {
            case State.run:
                prompt += '[run] # ';
                break;

            case State.debug:
                prompt += '[dbg] # ';
                break;
        }

        return prompt;
    }

    getFilesystemProvider(): FileSystemProviderInterface {
        return this._fsProvider;
    }

    private _setState(newState: State): void {
        if (this._state === newState) return;

        const timer = this._board.getTimer();

        this._state = newState;

        switch (this._state) {
            case State.run:
                if (this._outputBuffer) {
                    this._outputRaw(this._outputBuffer);
                    this._outputBuffer = '';
                }

                timer.start(this._scheduler);
                this._clockProbe.start();

                break;

            case State.debug:
                timer.stop();
                this._clockProbe.stop();
                break;

            case State.quit:
                timer.stop();
                if (this._allowQuit) this.events.quit.dispatch(undefined);
                break;
        }

        this.events.promptChanged.dispatch(undefined);
    }

    private _serialOutHandler(value: number): void {
        switch (this._state) {
            case State.debug:
                this._outputBuffer += String.fromCharCode(value);
                this._outputLine('output event, buffer now\n' +
                    this._outputBuffer +
                    "\n"
                );
                break;

            case State.run:
                this._outputRaw(String.fromCharCode(value));
                break;
        }
    }

    private _serialInHandler(): number {
        if (this._inputBuffer.length > 0) {
            this._promptForInput = true;
            return this._inputBuffer.shift();
        }

        if (this._state === State.run && this._promptForInput) {
            this._promptForInput = false;
            this._outputLine();
            this._prompt();
        }

        return 0;
    }

    private _outputRaw(output: string) {
        this._cliOutputBuffer += output;
    }

    private _outputLine(output: string = '') {
        this._cliOutputBuffer += (output + "\n");
    }

    private _flushOutput(): void {
        if (this._cliOutputBuffer) this.events.outputAvailable.dispatch(undefined);
    }

    private _prompt(): void {
        this._flushOutput();
        this.events.prompt.dispatch(undefined);
    }

    private _onTrap(trap: BoardInterface.TrapPayload, ctx: EhBasicCLI) {
        if (ctx._state === State.run) {
            ctx._setState(State.debug);

            ctx._outputLine('\n' + ctx._debuggerFrontend.describeTrap(trap));
            ctx._prompt();
        }
    }

    private _state: State;
    private _allowQuit = true;

    private _commands: Array<string>;

    private _outputBuffer = '';
    private _inputBuffer: Array<number> = [];

    private _promptForInput = true;

    private _cliOutputBuffer = '';
    private _flushOutputTask: TaskInterface;

    private _board: BoardInterface;
    private _commandInterpreter: CommandInterpreter;
    private _debuggerFrontend: DebuggerFrontend;
    private _scheduler: SchedulerInterface;
    private _clockProbe: ClockProbe;
}

export default EhBasicCLI;
