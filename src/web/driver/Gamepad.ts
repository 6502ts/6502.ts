import DigitalJoystickInterface from '../../machine/io/DigitalJoystickInterface';
import SwitchInterface from '../../machine/io/SwitchInterface';

const enum JoystickButton {
    left    = 1,
    right   = 2,
    up      = 3,
    down    = 4,
    fire    = 5
};

const standardMappings: {[button: number]: Array<number>} = {
    [JoystickButton.up]: [12],
    [JoystickButton.down]: [13],
    [JoystickButton.left]: [14],
    [JoystickButton.right]: [15],
    [JoystickButton.fire]: [0, 1, 2, 3]
};

export default class GamepadDriver {

    init(): void {
        if (!navigator.getGamepads) {
            throw new Error(`gamepad API not available`);
        }
    }

    bind(...joysticks: Array<DigitalJoystickInterface>): void {
        if (this._joysticks) {
            return;
        }

        this._joysticks = joysticks;

        for (let i = 0; i < this._joysticks.length; i++) {
            const joystick = this._joysticks[i];

            joystick.getLeft().beforeRead.addHandler(GamepadDriver._onBeforeSwitchRead, this);
        }
    }

    unbind(): void {
        if (!this._joysticks) {
            return;
        }

        for (let i = 0; i < this._joysticks.length; i++) {
            const joystick = this._joysticks[i];

            joystick.getLeft().beforeRead.removeHandler(GamepadDriver._onBeforeSwitchRead, this);
        }

        this._joysticks = null;
    }

    private _updateState(gamepad: Gamepad, joystickIndex: number): void {
        if (joystickIndex >= this._joysticks.length) {
            return;
        }

        const joystick = this._joysticks[joystickIndex];

        for (let i = 1; i <= 5; i++) {
            const mapping = standardMappings[i];
            let state = false;

            for (let j = 0; j < standardMappings[i].length; j++) {
                state = state || gamepad.buttons[mapping[j]].pressed;
            }

            this._updateButtonState(joystick, i, state);
        }
    }

    private _updateButtonState(
        joystick: DigitalJoystickInterface,
        button: JoystickButton,
        value: boolean
    ): void {
        switch (button) {
            case JoystickButton.left:
                return joystick.getLeft().toggle(value);

            case JoystickButton.right:
                return joystick.getRight().toggle(value);

            case JoystickButton.up:
                return joystick.getUp().toggle(value);

            case JoystickButton.down:
                return joystick.getDown().toggle(value);

            case JoystickButton.fire:
                return joystick.getFire().toggle(value);
        }
    }

    private static _onBeforeSwitchRead(swtch: SwitchInterface, self: GamepadDriver) {
        let joystickIndex = 0;

        const gamepads = navigator.getGamepads();

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];

            if (gamepad) {
                self._updateState(gamepad, joystickIndex++);
            }
        }
    }

    private _joysticks: Array<DigitalJoystickInterface> = null;

}
