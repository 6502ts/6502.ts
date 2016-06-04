import Switch from '../io/Switch';
import SwitchInterface from '../io/SwitchInterface';
import ControlPanelInterface from './ControlPanelInterface';

export default class ControlPanel implements ControlPanelInterface {

    getSelectSwitch(): SwitchInterface {
        return this._selectSwitch;
    }

    getResetButton(): SwitchInterface {
        return this._resetButton;
    }

    getColorSwitch(): SwitchInterface {
        return this._colorSwitch;
    }

    getDifficultySwitchP0(): SwitchInterface {
        return this._difficutlyP0;
    }

    getDifficultySwitchP1(): SwitchInterface {
        return this._difficutlyP1;
    }

    private _selectSwitch = new Switch();
    private _resetButton = new Switch();
    private _colorSwitch = new Switch();
    private _difficutlyP0 = new Switch();
    private _difficutlyP1 = new Switch();

}
