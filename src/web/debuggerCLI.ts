/// <reference path="../interface/jquery.terminal.d.ts"/>

import DebuggerCLI from "../cli/DebuggerCLI";
import JqtermCLIRunner from '../cli/JqtermCLIRunner';
import PrepackagedFilesystemProvider from '../fs/PrepackagedFilesystemProvider';

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
