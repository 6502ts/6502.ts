/// <reference path="./CLIInterface.d.ts"/>
/// <reference path="./FilesystemProviderInterface.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>

'use strict';

import events = require('events');
import Monitor = require('./EhBasicMonitor');
import Debugger = require('./Debugger');
import DebuggerFrontend = require('./DebuggerFrontend');
import Cpu = require('./Cpu');

enum State {
    debug, run, quit
}

var SAMPLE_SIZE = 20000000;
var OUTPUT_FLUSH_INTERVAL = 50;

class EhBasicCLI extends events.EventEmitter implements CLIInterface {
    constructor(
            private _fsProvider: FileSystemProviderInterface
    ) {
        super();

        this._monitor = new Monitor();
        this._cpu = new Cpu(this._monitor);
        this._debugger = new Debugger(this._monitor, this._cpu);
        this._frontend = new DebuggerFrontend(this._debugger, this._fsProvider);

        this._frontend.registerCommands({
            quit: (): string => {
                this._setState(State.quit);
                return 'bye';
            },
            run: (): string => {
                this._setState(State.run);
                return 'running, press ctl-c to interrupt...';
            },
            input: (args: Array<string>, cmd: string): string => {
                var data = cmd.replace(/^\s*input\s*/, '').replace(/\\n/, '\n'),
                    length = data.length;

                for (var i = 0; i < length; i++)
                    this._inputBuffer.push(data[i] === '\n' ? 0x0D : data.charCodeAt(i) & 0xFF);
                return '';
            },
            'run-script': (args: Array<string>): string => {
                if (!args.length) throw new Error('filenme required');
                this.runDebuggerScript(args[0]);
                return 'script executed';
            },
            'read-program': (args: Array<string>): string => {
                if (!args.length) throw new Error('filenme required');
                this.readBasicProgram(args[0]);
                return 'program read into buffer';
            }
        });

        this._commands = this._frontend.getCommands();
        this._monitor
            .setWriteHandler((value: number) => this._monitorWriteHandler(value))
            .setReadHandler(() => this._monitorReadHandler());
    }

    runDebuggerScript(filename: string): void {
        this._fsProvider.readTextFileSync(filename)
            .split('\n')
            .forEach((line: string): void => {
                this.pushInput(line);
            });
    }

    readBasicProgram(filename: string): void {
        this._fsProvider.readTextFileSync(filename)
            .split('\n')
            .forEach((line: string): void => {
                var length = line.length;
                for (var i = 0; i < length; i++) this._inputBuffer.push(line.charCodeAt(i) & 0xFF);
                this._inputBuffer.push(0x0D);
            });
    }

    startup(): void {
        this._setState(State.debug);

        this._cliFlushOutputInterval = setInterval(() => this._flushOutput(),
                OUTPUT_FLUSH_INTERVAL);

        this._schedule();
    }

    shutdown(): void {
        if (typeof(this._cliFlushOutputInterval) === 'undefined') return;

        clearInterval(this._cliFlushOutputInterval);
        this._cliFlushOutputInterval = undefined;
    }

    readOutput(): string {
        var buffer = this._cliOutputBuffer;
        this._cliOutputBuffer = '';
        return buffer;
    }

    availableCommands(): Array<string> {
        return this._frontend.getCommands();
    }

    interrupt(): void {
        switch (this._state) {
            case State.run:
                this._setState(State.debug);
                break;

            case State.debug:
                if (this._allowQuit) this._setState(State.quit);
                break;
        }

        this._schedule();
    }

    outputAvailable(): boolean {
        return !!this._cliOutputBuffer;
    }

    pushInput (data: string): void {
        switch (this._state) {
            case State.run:
                var size = data.length;

                for (var i = 0; i < size; i++) {
                    this._inputBuffer.push(data.charCodeAt(i) & 0xFF);
                }
                this._inputBuffer.push(0x0D);
                break;

            case State.debug:
                try {
                    this._outputLine(this._frontend.execute(data));
                } catch (e) {
                    this._outputLine('ERROR: ' + e.message);
                }
                this._schedule();
                break;
        }
    }

    allowQuit(toggle: boolean): void {
        this._allowQuit = toggle;
    }

    getPrompt(): string {
        var prompt = this._speed ? (this._speed.toFixed(2) + ' MHz ') : '';

        switch (this._state) {
            case State.run:
                prompt += '[run] # ';
                this._lastSpeedSample = Date.now();
                break;

            case State.debug:
                prompt += '[dbg] # ';
                break;
        }

        return prompt;
    }

    private _setState(newState: State): void {
        this._state = newState;

        switch (this._state) {
            case State.run:
                if (this._outputBuffer) {
                    this._outputRaw(this._outputBuffer);
                    this._outputBuffer = '';
                }

                this._cyclesProcessed = 0;
                break;
        }

        this.emit('promptChanged');
    }

    private _executeSlice() {
        try {
            var cycles = this._debugger.step(100000);
            if (this._debugger.executionInterrupted()) {
                switch (this._debugger.getExecutionState()) {
                    case Debugger.ExecutionState.breakpoint:
                        this._outputLine('BREAKPOINT');
                        break;

                    case Debugger.ExecutionState.invalidInstruction:
                        this._outputLine('INVALID INSTRUCTION');
                        break;
                }
                this._setState(State.debug);
            }
        } catch (e) {
            this._outputLine('ERROR: ' + e.message);
            this._setState(State.debug);
        }
      
        this._processSpeedSample(cycles);
        this._schedule();
    }

    private _processSpeedSample(cycles: number): void {
        this._cyclesProcessed += cycles;

        if (this._cyclesProcessed > SAMPLE_SIZE) {
            var timestamp = Date.now();

            this._speed = this._cyclesProcessed / (timestamp - this._lastSpeedSample) / 1000;
            this._cyclesProcessed = 0;
            this._lastSpeedSample = timestamp;

            this.emit('promptChanged');
        }
    }

    private _schedule() {
        switch (this._state) {
            case State.debug:
                this._prompt();
                break;

            case State.run:
                setImmediate(() => this._executeSlice());
                break;

            case State.quit:
                this.emit('quit');
                return;
        }
    }

    private _monitorWriteHandler(value: number): void {
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

    private _monitorReadHandler(): number {
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
        if (this._cliOutputBuffer) this.emit('outputAvailable');
    }

    private _prompt(): void {
        this._flushOutput();
        this.emit('prompt');
    }

    private _state: State;
    private _allowQuit = true;

    private _commands: Array<string>;

    private _outputBuffer = '';
    private _inputBuffer: Array<number> = [];

    private _promptForInput = true;

    private _lastSpeedSample: number;
    private _cyclesProcessed: number;
    private _speed: number;

    private _cliOutputBuffer = '';
    private _cliFlushOutputInterval: number;

    private _monitor: Monitor;
    private _debugger: Debugger;
    private _frontend: DebuggerFrontend;
    private _cpu: Cpu;
}

export = EhBasicCLI;
