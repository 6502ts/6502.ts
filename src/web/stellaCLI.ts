/// <reference path="../interface/jquery.terminal.d.ts"/>

import StellaCLI = require("../cli/StellaCLI");
import JqtermCLIRunner = require('../cli/JqtermCLIRunner');
import PrepackagedFilesystemProvider = require('../fs/PrepackagedFilesystemProvider');

export function run(
    fileBlob: PrepackagedFilesystemProvider.BlobInterface,
    terminalElt: JQuery,
    interruptButton: JQuery,
    clearButton: JQuery,
    cartridgeFile: string
) {
    const fsProvider = new PrepackagedFilesystemProvider(fileBlob),
        cli = new StellaCLI(fsProvider, cartridgeFile),
        runner = new JqtermCLIRunner(cli, terminalElt, {
            interruptButton: interruptButton,
            clearButton: clearButton
        });

    cli.allowQuit(false);
    runner.startup();
}
