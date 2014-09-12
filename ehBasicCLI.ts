import EhBasicCLI = require('./src/EhBasicCLI');
import NodeCLIRunner = require('./src/NodeCLIRunner');
import NodeFilesystemProvider = require('./src/NodeFilesystemProvider');

var fsProvider = new NodeFilesystemProvider(),
    cli = new EhBasicCLI(fsProvider),
    runner = new NodeCLIRunner(cli);

runner.startup();
