import FilesystemProviderInterface = require('../fs/FilesystemProviderInterface');
import EventInterface = require('../tools/event/EventInterface');

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

export = CLIInterface;
