/// <reference path="../../../typings/node/node.d.ts"/>

'use strict';

import SchedulerInterface = require('./SchedulerInterface');

class SetImmediateScheduler implements SchedulerInterface {

    start(worker: SchedulerInterface.WorkerInterface): SchedulerInterface.TerminatorInterface {
        var terminate = false;

        function handler() {
            if (terminate) return;

            worker();
            setImmediate(handler);
        }

        setImmediate(handler);

        return function() {
            terminate = true;
        }
    }
}

export = SetImmediateScheduler;
