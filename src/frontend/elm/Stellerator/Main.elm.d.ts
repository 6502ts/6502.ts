interface ElmOptions {}

export interface Ports {
    watchMedia: CommandPort<Array<string>>;
    mediaUpdate: SubscriptionPort<Array<boolean>>;
}

interface CommandPort<T> {
    subscribe(handler: (payload: T) => void): void;
}

interface SubscriptionPort<T> {
    send(payload: T): void;
}

export interface Main {
    init(options?: ElmOptions): { ports: Ports };
}

declare module Elm {
    export module Stellerator {
        const Main: Main;
    }
}

export default Elm;
