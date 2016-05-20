/// <reference path="../interface/jquery.terminal.d.ts"/>

import StellaCLI from "../cli/StellaCLI";
import JqtermCLIRunner from '../cli/JqtermCLIRunner';
import PrepackagedFilesystemProvider from '../fs/PrepackagedFilesystemProvider';
import ObjectPool from "../tools/pool/Pool";

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
