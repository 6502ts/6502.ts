/// <reference path="../interface/jquery.terminal.d.ts"/>

import EhBasicCLI from "../cli/EhBasicCLI";
import JqtermCLIRunner from '../cli/JqtermCLIRunner';
import PrepackagedFilesystemProvider from '../fs/PrepackagedFilesystemProvider';

export function run(
    fileBlob: PrepackagedFilesystemProvider.BlobInterface,
    terminalElt: JQuery,
    interruptButton: JQuery,
    clearButton: JQuery
) {
    const fsProvider = new PrepackagedFilesystemProvider(fileBlob),
        cli = new EhBasicCLI(fsProvider),
        runner = new JqtermCLIRunner(cli, terminalElt, {
            interruptButton: interruptButton,
            clearButton: clearButton
        });

    cli.allowQuit(false);
    runner.startup();
}
