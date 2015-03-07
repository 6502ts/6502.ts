/// <reference path="../../../typings/node/node.d.ts"/>

'use strict';

import SchedulerInterface = require('./SchedulerInterface');

class ImmediateScheduler implements SchedulerInterface {

    start<T>(worker: SchedulerInterface.WorkerInterface<T>, context?: T): SchedulerInterface.TerminatorInterface {
        var terminate = false;

        function handler() {
            if (terminate) return;

            worker(context);
            setImmediate(handler);
        }

        setImmediate(handler);

        return function() {
            terminate = true;
        }
    }
}

export = ImmediateScheduler;
