import ControlPanelInterface from '../../machine/stella/ControlPanelInterface';
import CommandInterpreter from '../CommandInterpreter';
import SwitchInterface from '../../machine/io/SwitchInterface';

class CotrolPanelManagementProvider {

    constructor(protected _controlPanel: ControlPanelInterface) {}

    getCommands(): CommandInterpreter.CommandTableInterface {
        return this._commands;
    }

    protected _changeColorSwitch(args?: Array<string>) {
        const swtch = this._controlPanel.getColorSwitch();

        if (args && args.length > 0) {
            switch (args[0].toLowerCase()) {
                case '1':
                case 'on':
                case 'bw':
                    swtch.toggle(true);
                    break;

                case '0':
                case 'off':
                case 'color':
                    swtch.toggle(false);
                    break;

                default:
                    throw new Error(`invalid switch state '${args[0]}'`);
            }
        }

        return `color switch: ${swtch.read() ? 'BW' : 'color'}`;
    }

    protected _changeDifficultySwitch(swtch: SwitchInterface, playerId: number, args?: Array<string>) {
        if (args && args.length > 0) {
            switch (args[0].toLowerCase()) {
                case '1':
                case 'on':
                case 'b':
                case 'amateur':
                    swtch.toggle(true);
                    break;

                case '0':
                case 'off':
                case 'a':
                case 'pro':
                    swtch.toggle(false);
                    break;

                default:
                    throw new Error(`invalid switch state '${args[0]}'`);
            }
        }

        return `player ${playerId} difficulty switch: ${swtch.read() ? 'amateur' : 'pro'}`;
    }

    protected _commands: CommandInterpreter.CommandTableInterface = {
        'switch-color': this._changeColorSwitch.bind(this),
        'switch-difficulty-player-0': (args?: Array<string>) =>
            this._changeDifficultySwitch(this._controlPanel.getDifficultySwitchP0(), 0, args),
        'switch-difficulty-player-1': (args?: Array<string>) =>
            this._changeDifficultySwitch(this._controlPanel.getDifficultySwitchP1(), 1, args),
    };

}

export default CotrolPanelManagementProvider;
