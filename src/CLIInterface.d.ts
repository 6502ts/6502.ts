interface CLIInterface {
    pushInput(input: string): void;

    interrupt(): void;

    outputAvailable(): boolean;

    readOutput(): string;

    availableCommands(): Array<string>;

    /**
      * Events:
      *
      * - outputAvailable (no arguments)
      * - quit (no arguments)
      * - changePrompt (string argument: new prompt)
      * - prompt
      */
    on(event: string, handler: Function): void;

    startup(): void;
}
