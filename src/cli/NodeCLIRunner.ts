import * as readline from 'readline';
import CLIInterface from './CLIInterface';
import Completer from './Completer';

class NodeCLIRunner {
    constructor(private _cli: CLIInterface) {
        this._completer = new Completer(
            this._cli.availableCommands(), this._cli.getFilesystemProvider());

        this._readline = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: (cmd: string): any => {
                const result = this._completer.complete(cmd);
                return [result.candidates, result.match];
            }
        });

        this._readline.on('line', (data: string) => this._cli.pushInput(data));
        this._readline.on('SIGINT', () => this._cli.interrupt());

        this._cli.events.outputAvailable.addHandler(this._onCLIOutputAvailable, this);
        this._cli.events.promptChanged.addHandler(this._onCLIPromptChanged, this);
        this._cli.events.quit.addHandler(this._onCLIQuit, this);
        this._cli.events.prompt.addHandler(this._onCLIPrompt, this);
    }

    startup(): void {
        this._cli.startup();

        const prompt = this._cli.getPrompt();
        this._readline.setPrompt(prompt);

        this._readline.prompt();
    }

    private _onCLIQuit(payload: void, ctx: NodeCLIRunner): void {
        ctx._closed = true;
        ctx._cli.shutdown();
        ctx._readline.close();
    }

    private _onCLIOutputAvailable(payload: void, ctx: NodeCLIRunner): void {
        if (ctx._closed) return;

        const output = ctx._cli.readOutput();
        process.stdout.write(output);

        ctx._readline.prompt();
    }

    private _onCLIPromptChanged(payload: void, ctx: NodeCLIRunner) {
        if (ctx._closed) return;

        const prompt = ctx._cli.getPrompt();
        ctx._readline.setPrompt(prompt);
    }

    private _onCLIPrompt(payload: void, ctx: NodeCLIRunner) {
        if (ctx._closed) return;

        ctx._readline.prompt();
    }

    private _closed = false;
    private _readline: readline.ReadLine;
    private _completer: Completer;
}

export default NodeCLIRunner;
