interface EventInterface <EventPayload> {

    addHandler(handler: (payload: EventPayload) => void): EventInterface<EventPayload>;

    removeHandler(handler: (payload: EventPayload) => void): EventInterface<EventPayload>;
}

export = EventInterface;
