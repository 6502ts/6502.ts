/// <reference path="../../typings/jquery/jquery.d.ts"/>

interface JQueryTerminal {
    echo(message: string): void;
    set_prompt(prompt: string): void;
    clear(): void;
}

interface JQueryTerminalOptions {
    greetings?: string
    completion?: JQueryTerminalCompletionHandler
    exit?: boolean
    clear?: boolean
}

interface JQueryTerminalInterpreterFunction {
    (cmd: string, terminal: JQueryTerminal): void;
}

interface JQueryTerminalCompletionHandler {
    (terminal: JQueryTerminal, cmd: string, handler: (candidates: Array<string>) => void): void
}

interface JQuery {
    terminal(rpcURI: string, options?: JQueryTerminalOptions): JQueryTerminal;
    terminal(interpreter: JQueryTerminalInterpreterFunction,
        options?: JQueryTerminalOptions): JQueryTerminal;
}
