interface SchedulerInterface {
    start(worker: SchedulerInterface.WorkerInterface): SchedulerInterface.TerminatorInterface;
}

module SchedulerInterface {
    export interface WorkerInterface {
        (): void;
    }

    export interface TerminatorInterface {
        (): void;
    }
}

export = SchedulerInterface;
