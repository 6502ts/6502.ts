import TaskInterface from './TaskInterface';

interface LimitingSchedulerInterface {
    start<T>(
        worker: LimitingSchedulerInterface.WorkerInterface<T>,
        context?: T
    ): TaskInterface;
}

module LimitingSchedulerInterface {
    export interface WorkerInterface<T> {
        (context: T): number;
    }
}

export default LimitingSchedulerInterface;
