import TestCLI = require('../src/cli/TestCLI');
import NodeCLIRunner = require('../src/cli/NodeCLIRunner');

const cli = new TestCLI(),
    runner = new NodeCLIRunner(cli);

runner.startup();
