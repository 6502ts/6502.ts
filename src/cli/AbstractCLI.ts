import Event from '../tools/event/Event';

abstract class AbstractCLI {

    events = {
        outputAvailable: new Event<void>(),
        quit: new Event<void>(),
        promptChanged: new Event<void>(),
        prompt: new Event<void>(),
        availableCommandsChanged: new Event<void>()
    };

}

export default AbstractCLI;
