class CommandInterpreter {
    constructor(
        commandTable?: CommandInterpreter.CommandTableInterface
    ) {
        if (typeof(commandTable) !== 'undefined') this.registerCommands(commandTable);
    }

    public registerCommands(commandTable: CommandInterpreter.CommandTableInterface) {
        Object.keys(commandTable).forEach(
            (command: string) => this._commandTable[command] = commandTable[command]
        );
    }

    public execute(cmd: string): string {
        cmd = cmd.replace(/;.*/, '');
        if (cmd.match(/^\s*$/)) return '';

        const components = cmd.split(/\s+/).filter((value: string): boolean => !!value),
            commandName = components.shift();

        return this._locateCommand(commandName).call(this, components, cmd);
    }

    public getCommands(): Array<string> {
        return Object.keys(this._commandTable);
    }

    private _locateCommand(name: string): CommandInterpreter.CommandInterface {
        if (this._commandTable[name]) return this._commandTable[name];
        if (this._aliasTable[name]) return this._aliasTable[name];

        const candidates = Object.keys(this._commandTable).filter(
            (candidate: string) => candidate.indexOf(name) === 0
        );
        const nCandidates = candidates.length;

        if (nCandidates > 1) throw new Error('ambiguous command ' + name + ', candidates are ' +
            candidates.join(', ').replace(/, $/, ''));

        if (nCandidates === 0) throw new Error('invalid command ' + name);

        return this._aliasTable[name] = this._commandTable[candidates[0]];
    }

    private _commandTable: CommandInterpreter.CommandTableInterface = {};
    private _aliasTable: CommandInterpreter.CommandTableInterface = {};
}

module CommandInterpreter {
    export interface CommandInterface {
        (args: Array<string>, cmdString?: string): string;
    }

    export interface CommandTableInterface {
        [command: string]: CommandInterface;
    }
}

export = CommandInterpreter;
