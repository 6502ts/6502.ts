/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="./CLIInterface.d.ts"/>

import CommandInterpreter = require('./CommandInterpreter');
import events = require('events');

class TestCLI extends events.EventEmitter implements CLIInterface {
    constructor() {
        super();
        this._interpreter = new CommandInterpreter({
            hello: () => "Hello world!",
            quit: (): string => {
                this.emit('quit');
                return 'Bye...';
            }
        });
    }

    startup(): void {
        this.emit('changePrompt', '[foo] > ');
    }

    pushInput(input: string) {
        var result: string;

        try {
            result = this._interpreter.execute(input);
        } catch (e) {
            result = e.message;
        }

        this._output(result);
    }

    outputAvailable(): boolean {
        return !!this._outputBuffer;
    }

    readOutput(): string {
        var buffer = this._outputBuffer;
        this._outputBuffer = '';
        return buffer;
    }

    availableCommands(): Array<string> {
        return this._interpreter.getCommands();
    }

    interrupt(): void {
        this._output('Interrupted...');
    }

    private _output(output: string) {
        this._outputBuffer += (output + "\n");
        this.emit('outputAvailable');
    }

    private _outputBuffer = '';
    private _interpreter: CommandInterpreter;
}

export = TestCLI;
