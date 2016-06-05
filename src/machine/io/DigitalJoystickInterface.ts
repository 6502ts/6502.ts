import SwitchInterface from './SwitchInterface';

interface DigitalJoystickInterface {

    getLeft(): SwitchInterface;
    getRight(): SwitchInterface;
    getUp(): SwitchInterface;
    getDown(): SwitchInterface;

    getFire(): SwitchInterface;

}

export default DigitalJoystickInterface;
