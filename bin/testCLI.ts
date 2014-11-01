'use strict';

import TestCLI = require('../src/cli/TestCLI');
import NodeCLIRunner = require('../src/node/NodeCLIRunner');

var cli = new TestCLI(),
    runner = new NodeCLIRunner(cli);

runner.startup();
