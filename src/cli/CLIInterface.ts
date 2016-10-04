import {EventInterface} from 'microevent.ts';

import FilesystemProviderInterface from '../fs/FilesystemProviderInterface';

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

    events: CLIInterface.Events;
}

module CLIInterface {
    export interface Events {
        outputAvailable: EventInterface<void>;

        quit: EventInterface<void>;

        promptChanged: EventInterface<void>;

        prompt: EventInterface<void>;

        availableCommandsChanged: EventInterface<void>;
    }
}

export default CLIInterface;
