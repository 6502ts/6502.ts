import Config from '../../machine/stella/Config';
import CommandInterpreter from '../CommandInterpreter';

export default class SystemConfigSetupProvider {

    constructor(private _config: Config) {}

    getCommands(): CommandInterpreter.CommandTableInterface {
        return this._commands;
    }

    protected _setupVideo(args?: Array<string>) {
        if (!args || args.length === 0) {
            return `current TV mode: ${this._humanReadableTvMode(this._config.tvMode)}`;
        }

        switch (args[0].toLowerCase()) {
            case 'ntsc':
                this._config.tvMode = Config.TvMode.ntsc;
                break;

            case 'pal':
                this._config.tvMode = Config.TvMode.pal;
                break;

            case 'secam':
                this._config.tvMode = Config.TvMode.secam;
                break;

            default:
                throw new Error(`invalid TV mode "${args[0]}"`);
        }

        return `switched TV mode to ${this._humanReadableTvMode(this._config.tvMode)}`;
    }

    protected _setupAudio(args?: Array<string>) {
        if (args && args.length !== 0) {
            this._config.enableAudio = this._isArgTruthy(args[0]);
        }

        return `audio ${this._config.enableAudio ? 'enabled' : 'disabled'}`;
    }

    protected _setupPaddles(args?: Array<string>) {
        if (args && args.length !== 0) {
            this._config.emulatePaddles = (this._isArgTruthy(args[0]));
        }

        return `paddle emulation: ${this._config.emulatePaddles ? 'enabled' : 'disabled'}`;
    }

    protected _humanReadableTvMode(mode: Config.TvMode) {
        switch (mode) {
            case Config.TvMode.ntsc:
                return 'NTSC';

            case Config.TvMode.pal:
                return 'PAL';

            case Config.TvMode.secam:
                return 'SECAM';

            default:
                throw new Error(`invalid TV mode ${mode}`);
        }
    }

    protected _isArgTruthy(arg: string): boolean {
        const normalizedArg = arg.toLocaleLowerCase();

        return normalizedArg === 'yes' || normalizedArg === 'true' || normalizedArg === '1';
    }

    _commands: CommandInterpreter.CommandTableInterface = {
        'tv-mode': this._setupVideo.bind(this),
        'audio': this._setupAudio.bind(this),
        'paddles': this._setupPaddles.bind(this)
    };

}
