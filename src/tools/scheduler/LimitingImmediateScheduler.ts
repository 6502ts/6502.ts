import * as polyfill from 'setimmediate2';

import LimitingSchedulerInterface from './LimitingSchedulerInterface';
import TaskInterface from './TaskInterface';

class LimitingImmediateScheduler implements LimitingSchedulerInterface {

    start<T>(worker: LimitingSchedulerInterface.WorkerInterface<T>, context?: T): TaskInterface {
        let terminate = false;

        function handler() {
            if (terminate) return;

            const timestamp = Date.now(),
                targetDuration = worker(context),
                delay = targetDuration - Date.now() + timestamp;

            if (delay > 0) {
                setTimeout(handler, delay);
            } else {
                polyfill.setImmediate(handler);
            }
        }

        polyfill.setImmediate(handler);

        return {
            stop: () => terminate = true
        };
    }
}

export default LimitingImmediateScheduler;
