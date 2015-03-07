interface SchedulerInterface {
    start<T>(worker: SchedulerInterface.WorkerInterface<T>, context?: T): SchedulerInterface.TerminatorInterface;
}

module SchedulerInterface {
    export interface WorkerInterface<T> {
        (context: T): void;
    }

    export interface TerminatorInterface {
        (): void;
    }
}

export = SchedulerInterface;
