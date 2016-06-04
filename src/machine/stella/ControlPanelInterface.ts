import SwitchInterface from '../io/SwitchInterface';

interface ControlPanelInterface {

    getSelectSwitch(): SwitchInterface;
    getResetButton(): SwitchInterface;
    getColorSwitch(): SwitchInterface;
    getDifficultySwitchP0(): SwitchInterface;
    getDifficultySwitchP1(): SwitchInterface;

}

export default ControlPanelInterface;
