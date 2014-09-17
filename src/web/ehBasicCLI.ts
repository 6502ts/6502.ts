/// <reference path="./jquery.terminal.d.ts"/>

import EhBasicCLI = require("../EhBasicCLI");
import JqtermCLIRunner = require('./JqtermCLIRunner');
import PrepackagedFilesystemProvider = require('./PrepackagedFilesystemProvider');

export function run(
    terminalElt: JQuery,
    interruptButton: JQuery,
    clearButton: JQuery
) {
    var fsProvider = new PrepackagedFilesystemProvider(),
        cli = new EhBasicCLI(fsProvider),
        runner = new JqtermCLIRunner(cli, terminalElt, {
            interruptButton: interruptButton,
            clearButton: clearButton
        });

    runner.startup();
}
