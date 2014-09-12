import TestCLI = require('./src/TestCLI');
import NodeCLIRunner = require('./src/NodeCLIRunner');

var cli = new TestCLI(),
    runner = new NodeCLIRunner(cli);

runner.startup();
