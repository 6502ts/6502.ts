import FilesystemProviderInterface from '../fs/FilesystemProviderInterface';
import EventInterface from '../tools/event/EventInterface';

interface CLIInterface {
    pushInput(input: string): void;

    interrupt(): void;

    outputAvailable(): boolean;

    readOutput(): string;

    availableCommands(): Array<string>;

    getPrompt(): string;

    startup(): void;

    shutdown(): void;

    getFilesystemProvider(): FilesystemProviderInterface;

    events: {
        outputAvailable: EventInterface<void>;

        quit: EventInterface<void>;

        promptChanged: EventInterface<void>;

        prompt: EventInterface<void>;
    };
}

export default CLIInterface;
