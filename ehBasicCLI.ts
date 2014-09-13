import EhBasicCLI = require('./src/EhBasicCLI');
import NodeCLIRunner = require('./src/NodeCLIRunner');
import NodeFilesystemProvider = require('./src/NodeFilesystemProvider');

var fsProvider = new NodeFilesystemProvider(),
    cli = new EhBasicCLI(fsProvider),
    runner = new NodeCLIRunner(cli);

runner.startup();

if (process.argv.length > 2) cli.runDebuggerScript(process.argv[2]);
if (process.argv.length > 3) cli.readBasicProgram(process.argv[3]);
