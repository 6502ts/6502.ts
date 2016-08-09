import * as polyfill from 'setimmediate2';

import SchedulerInterface from './SchedulerInterface';
import TaskInterface from './TaskInterface';

class ImmediateScheduler implements SchedulerInterface {

    start<T>(worker: SchedulerInterface.WorkerInterface<T>, context?: T): TaskInterface {
        let terminate = false;

        function handler() {
            if (terminate) return;

            worker(context);
            polyfill.setImmediate(handler);
        }

        polyfill.setImmediate(handler);

        return {
            stop: () => terminate = true
        };
    }
}

export default ImmediateScheduler;
