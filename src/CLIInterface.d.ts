interface CLIInterface {
    pushInput(input: string): void;

    interrupt(): void;

    inputAvailable(): boolean;

    readInput(): string;

    // There are two events: inputReady and interrupt
    on(event: string, handler: () => void): void;
}
