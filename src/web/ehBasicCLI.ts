/// <reference path="./jquery.terminal.d.ts"/>

'use strict';

import EhBasicCLI = require("../cli/EhBasicCLI");
import JqtermCLIRunner = require('./JqtermCLIRunner');
import PrepackagedFilesystemProvider = require('./PrepackagedFilesystemProvider');

export function run(
    fileBlob: PrepackagedFilesystemProvider.BlobInterface,
    terminalElt: JQuery,
    interruptButton: JQuery,
    clearButton: JQuery
) {
    var fsProvider = new PrepackagedFilesystemProvider(fileBlob),
        cli = new EhBasicCLI(fsProvider),
        runner = new JqtermCLIRunner(cli, terminalElt, {
            interruptButton: interruptButton,
            clearButton: clearButton
        });

    cli.allowQuit(false);
    runner.startup();
}
