import TestCLI from '../src/cli/TestCLI';
import NodeCLIRunner from '../src/cli/NodeCLIRunner';

const cli = new TestCLI(),
    runner = new NodeCLIRunner(cli);

runner.startup();
