interface CLIInterface {
    pushInput(input: string): void;

    interrupt(): void;

    outputAvailable(): boolean;

    readOutput(): string;

    availableCommands(): Array<string>;

    getPrompt(): string;

    /**
      * Events:
      *
      * - outputAvailable
      * - quit
      * - promptChanged
      * - prompt
      */
    on(event: string, handler: () => void): void;

    startup(): void;

    shutdown(): void;
}

export = CLIInterface;
