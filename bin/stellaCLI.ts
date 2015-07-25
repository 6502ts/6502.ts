'use strict';

import StellaCLI = require('../src/cli/StellaCLI');
import NodeCLIRunner = require('../src/cli/NodeCLIRunner');
import NodeFilesystemProvider = require('../src/fs/NodeFilesystemProvider');

if (process.argv.length < 3) {
    console.log('usage: stellaCLI.ts cartridge_file [debugger_script]');
    process.exit(1);
}

var cartridgeFile = process.argv[2];

var fsProvider = new NodeFilesystemProvider(),
    cli = new StellaCLI(fsProvider, cartridgeFile),
    runner = new NodeCLIRunner(cli);

runner.startup();

if (process.argv.length > 3) cli.runDebuggerScript(process.argv[3]);
