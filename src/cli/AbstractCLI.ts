'use strict';

import CLIInterface = require('./CLIInterface');
import Event = require('../tools/event/Event');

class AbstractCLI {

    events = {
        outputAvailable: new Event<void>(),
        quit: new Event<void>(),
        promptChanged: new Event<void>(),
        prompt: new Event<void>()
    };

}

export = AbstractCLI;
