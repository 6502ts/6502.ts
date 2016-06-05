import DigitalJoystickInterface from './DigitalJoystickInterface';
import Switch from './Switch';
import SwitchInterface from './SwitchInterface';

export default class DigitalJoystick implements DigitalJoystickInterface {

    getLeft(): SwitchInterface {
        return this._left;
    }

    getRight(): SwitchInterface {
        return this._right;
    }

    getUp(): SwitchInterface {
        return this._up;
    }

    getDown(): SwitchInterface {
        return this._down;
    }

    getFire(): SwitchInterface {
        return this._fire;
    }

    private _left = new Switch();
    private _right = new Switch();
    private _up = new Switch();
    private _down = new Switch();

    private _fire = new Switch();

}
