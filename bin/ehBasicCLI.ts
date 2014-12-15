'use strict';

import EhBasicCLI = require('../src/cli/EhBasicCLI');
import NodeCLIRunner = require('../src/cli/NodeCLIRunner');
import NodeFilesystemProvider = require('../src/fs/NodeFilesystemProvider');

var fsProvider = new NodeFilesystemProvider(),
    cli = new EhBasicCLI(fsProvider),
    runner = new NodeCLIRunner(cli);

runner.startup();

if (process.argv.length > 2) cli.runDebuggerScript(process.argv[2]);
if (process.argv.length > 3) cli.readBasicProgram(process.argv[3]);
