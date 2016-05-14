import DebuggerCLI = require('../src/cli/DebuggerCLI');
import NodeCLIRunner = require('../src/cli/NodeCLIRunner');
import NodeFilesystemProvider = require('../src/fs/NodeFilesystemProvider');

const fsProvider = new NodeFilesystemProvider(),
    cli = new DebuggerCLI(fsProvider),
    runner = new NodeCLIRunner(cli);

runner.startup();

if (process.argv.length > 2) cli.runDebuggerScript(process.argv[2]);
