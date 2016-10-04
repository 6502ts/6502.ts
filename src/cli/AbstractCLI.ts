import {Event} from 'microevent.ts';

abstract class AbstractCLI {

    events: AbstractCLI.Events = {
        outputAvailable: new Event<void>(),
        quit: new Event<void>(),
        promptChanged: new Event<void>(),
        prompt: new Event<void>(),
        availableCommandsChanged: new Event<void>()
    };

}

module AbstractCLI {
    export interface Events {
        outputAvailable: Event<void>;

        quit: Event<void>;

        promptChanged: Event<void>;

        prompt: Event<void>;

        availableCommandsChanged: Event<void>;
    }
}

export default AbstractCLI;
