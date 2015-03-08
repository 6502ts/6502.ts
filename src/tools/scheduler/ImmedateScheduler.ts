/// <reference path="../../../typings/node/node.d.ts"/>

'use strict';

import SchedulerInterface = require('./SchedulerInterface');
import TaskInterface = require('./TaskInterface');

class ImmediateScheduler implements SchedulerInterface {

    start<T>(worker: SchedulerInterface.WorkerInterface<T>, context?: T): TaskInterface {
        var terminate = false;

        function handler() {
            if (terminate) return;

            worker(context);
            setImmediate(handler);
        }

        setImmediate(handler);

        return {
            stop: () => terminate = true
        };
    }
}

export = ImmediateScheduler;
