/// <reference path="../../typings/jquery/jquery.d.ts"/>

interface JQueryTerminal {
    echo(message: string): void;
}

interface JQueryTerminalOptions {
    greetings?: string
}

interface JQueryTerminalInterpreterFunction {
    (cmd: string, terminal: JQueryTerminal): void;
}

interface JQuery {
    terminal(rpcURI: string, options?: JQueryTerminalOptions): JQueryTerminal;
    terminal(interpreter: JQueryTerminalInterpreterFunction,
        options?: JQueryTerminalOptions): JQueryTerminal;
}
