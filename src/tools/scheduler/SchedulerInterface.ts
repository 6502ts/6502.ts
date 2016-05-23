import TaskInterface from './TaskInterface';

interface SchedulerInterface {
    start<T>(
        worker: SchedulerInterface.WorkerInterface<T>,
        context?: T
    ): TaskInterface;
}

module SchedulerInterface {
    export interface WorkerInterface<T> {
        (context: T): void;
    }
}

export default SchedulerInterface;
