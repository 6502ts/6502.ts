'use strict';

import TaskInterface = require('./TaskInterface');

interface SchedulerInterface {
    start<T>(worker: SchedulerInterface.WorkerInterface<T>, context?: T): TaskInterface;
}

module SchedulerInterface {
    export interface WorkerInterface<T> {
        (context: T): void;
    }
}

export = SchedulerInterface;
