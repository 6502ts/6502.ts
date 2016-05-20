/// <reference path="../interface/jquery.terminal.d.ts"/>

import TestCLI from "../cli/TestCLI";
import JqtermCLIRunner from '../cli/JqtermCLIRunner';

export function run(
    terminalElt: JQuery,
    interruptButton: JQuery,
    clearButton: JQuery
) {
    const cli = new TestCLI(),
        runner = new JqtermCLIRunner(cli, terminalElt, {
            interruptButton: interruptButton,
            clearButton: clearButton
        });

    runner.startup();
}
