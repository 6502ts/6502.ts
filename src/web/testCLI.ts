/// <reference path="../../typings/jquery/jquery.d.ts"/>
/// <reference path="./jquery.terminal.d.ts"/>

import TestCLI = require("../TestCLI");

export function run(terminalElt: JQuery) {
    terminalElt.terminal((cmd: string, terminal: JQueryTerminal): void => {
        if (cmd.match(/^alert /)) {
            var message = cmd.substr(6);

                terminal.echo('Show alert with message "' + message + '"');
                alert(message);

            } else if (cmd === 'help') {
              terminal.echo('alert [message]  Show an alert box with message');
              terminal.echo('help             Display this help message');

            } else {
              terminal.echo('Commmand "' + cmd + '" not found');
            }

    }, {
        greetings: 'Hello world!'
    });
}
