interface EventInterface <EventPayload> {

    addHandler(handler: (payload: EventPayload, context: any) => void, context?: any): EventInterface<EventPayload>;

    removeHandler(handler: (payload: EventPayload, context: any) => void, context?: any): EventInterface<EventPayload>;
}

export = EventInterface;
