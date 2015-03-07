interface EventInterface <EventPayload> {

    addHandler<T>(handler: (payload: EventPayload, context: T) => void, context?: T): EventInterface<EventPayload>;

    removeHandler<T>(handler: (payload: EventPayload, context: T) => void, context?: T): EventInterface<EventPayload>;
}

export = EventInterface;
