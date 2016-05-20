import CommandInterpreter from './CommandInterpreter';
import CLIInterface from './CLIInterface';
import FilesystemProviderInterface from '../fs/FilesystemProviderInterface';
import AbstractCLI from './AbstractCLI';

class TestCLI extends AbstractCLI implements CLIInterface {
    constructor() {
        super();
        this._interpreter = new CommandInterpreter({
            hello: () => "Hello world!",
            quit: (): string => {
                this.events.quit.dispatch(undefined);
                return 'Bye...';
            }
        });
    }

    startup(): void {
        this.events.prompt.dispatch(undefined);
    }

    shutdown(): void {}

    getPrompt(): string {
        return '[foo] > ';
    }

    pushInput(input: string) {
        let result: string;

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
        const buffer = this._outputBuffer;
        this._outputBuffer = '';
        return buffer;
    }

    availableCommands(): Array<string> {
        return this._interpreter.getCommands();
    }

    interrupt(): void {
        this._output('Interrupted...');
    }

    getFilesystemProvider(): FilesystemProviderInterface {
        return undefined;
    }

    private _output(output: string) {
        this._outputBuffer += (output + "\n");
        this.events.outputAvailable.dispatch(undefined);
    }

    private _outputBuffer = '';
    private _interpreter: CommandInterpreter;
}

export default TestCLI;
