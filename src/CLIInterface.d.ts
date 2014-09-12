interface CLIInterface {
    pushInput(input: string): void;

    interrupt(): void;

    outputAvailable(): boolean;

    readOutput(): string;

    availableCommands(): Array<string>;

    // There are two events: outputReady and quit
    on(event: string, handler: () => void): void;
}
