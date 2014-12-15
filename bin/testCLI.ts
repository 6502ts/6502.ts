'use strict';

import TestCLI = require('../src/cli/TestCLI');
import NodeCLIRunner = require('../src/cli/NodeCLIRunner');

var cli = new TestCLI(),
    runner = new NodeCLIRunner(cli);

runner.startup();
