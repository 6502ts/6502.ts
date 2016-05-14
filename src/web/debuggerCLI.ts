/// <reference path="../interface/jquery.terminal.d.ts"/>

import DebuggerCLI = require("../cli/DebuggerCLI");
import JqtermCLIRunner = require('../cli/JqtermCLIRunner');
import PrepackagedFilesystemProvider = require('../fs/PrepackagedFilesystemProvider');

export function run(
    fileBlob: PrepackagedFilesystemProvider.BlobInterface,
    terminalElt: JQuery,
    interruptButton: JQuery,
    clearButton: JQuery
) {
    const fsProvider = new PrepackagedFilesystemProvider(fileBlob),
        cli = new DebuggerCLI(fsProvider),
        runner = new JqtermCLIRunner(cli, terminalElt, {
            interruptButton: interruptButton,
            clearButton: clearButton
        });

    cli.allowQuit(false);
    runner.startup();
}
