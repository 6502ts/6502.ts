/// <reference path="../../typings/jquery/jquery.d.ts"/>
/// <reference path="./jquery.terminal.d.ts"/>

import TestCLI = require("../TestCLI");
import JqtermCLIRunner = require('./JqtermCLIRunner');

export function run(
    terminalElt: JQuery,
    interruptButton: JQuery,
    clearButton: JQuery
) {
    var cli = new TestCLI(),
        runner = new JqtermCLIRunner(cli, terminalElt, {
            interruptButton: interruptButton,
            clearButton: clearButton
        });

    runner.startup();
}
