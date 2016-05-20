import CLIInterface from './CLIInterface';
import Event from '../tools/event/Event';

abstract class AbstractCLI {

    events = {
        outputAvailable: new Event<void>(),
        quit: new Event<void>(),
        promptChanged: new Event<void>(),
        prompt: new Event<void>()
    };

}

export default AbstractCLI;
