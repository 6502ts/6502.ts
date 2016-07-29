import DigitalJoystickInterface from '../../machine/io/DigitalJoystickInterface';
import SwitchInterface from '../../machine/io/SwitchInterface';

const enum MappingButton {
    left    = 1,
    right   = 2,
    up      = 3,
    down    = 4,
    fire    = 5,
    start   = 6,
    select  = 7
};

const standardMappings: {[button: number]: Array<number>} = {
    [MappingButton.up]:     [12],
    [MappingButton.down]:   [13],
    [MappingButton.left]:   [14],
    [MappingButton.right]:  [15],
    [MappingButton.fire]:   [0, 1, 2, 3, 10, 11],
    [MappingButton.select]: [8],
    [MappingButton.start]:  [9]
};

export default class GamepadDriver {

    init(): void {
        if (!navigator.getGamepads) {
            throw new Error(`gamepad API not available`);
        }
    }

    bind({joysticks = null, start = null, select = null}: {
        joysticks?: Array<DigitalJoystickInterface>,
        start?: SwitchInterface,
        select?: SwitchInterface
    }): void {
        if (this._bound) {
            return;
        }

        this._joysticks = joysticks;
        this._start = start;
        this._select = select;
        this._bound = true;

        if (this._joysticks) {
            for (let i = 0; i < this._joysticks.length; i++) {
                const joystick = this._joysticks[i];

                joystick.getLeft().beforeRead.addHandler(GamepadDriver._onBeforeSwitchRead, this);
            }
        }

        if (this._select) {
            this._select.beforeRead.addHandler(GamepadDriver._onBeforeSwitchRead, this);
        }

        if (this._start) {
            this._start.beforeRead.addHandler(GamepadDriver._onBeforeSwitchRead, this);
        }
    }

    unbind(): void {
        if (!this._bound) {
            return;
        }

        if (this._joysticks) {
            for (let i = 0; i < this._joysticks.length; i++) {
                const joystick = this._joysticks[i];

                joystick.getLeft().beforeRead.removeHandler(GamepadDriver._onBeforeSwitchRead, this);
            }
        }

        if (this._select) {
            this._select.beforeRead.removeHandler(GamepadDriver._onBeforeSwitchRead, this);
        }

        if (this._start) {
            this._start.beforeRead.removeHandler(GamepadDriver._onBeforeSwitchRead, this);
        }

        this._joysticks = this._start = this._select = null;
        this._bound = false;
    }

    private static _onBeforeSwitchRead(swtch: SwitchInterface, self: GamepadDriver) {
        let gamepadCount = 0,
            joystickIndex = 0,
            start = false,
            select = false;

        const gamepads = navigator.getGamepads();

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];

            if (!gamepad || gamepad.mapping !== 'standard') {
                continue;
            }

            gamepadCount++;

            self._updateJoystickState(gamepad, joystickIndex++);

            start = start || self._readState(standardMappings[MappingButton.start], gamepad);
            select = select || self._readState(standardMappings[MappingButton.select], gamepad);
        }

        if (gamepadCount > 0) {
            if (self._start) {
                self._start.toggle(start);
            }

            if (self._select) {
                self._select.toggle(select);
            }
        }
    }

    private _readState(mapping: Array<number>, gamepad: Gamepad): boolean {
        let state = false;

        for (let i = 0; i < mapping.length; i++) {
            state = state || gamepad.buttons[mapping[i]].pressed;
        }

        return state;
    }

    private _updateJoystickState(gamepad: Gamepad, joystickIndex: number): void {
        if (!this._joysticks || joystickIndex >= this._joysticks.length) {
            return;
        }

        const joystick = this._joysticks[joystickIndex];

        for (let i = 1; i <= 5; i++) {
            const mapping = standardMappings[i];
            let state = false;

            for (let j = 0; j < standardMappings[i].length; j++) {
                state = state || gamepad.buttons[mapping[j]].pressed;
            }

            this._updateJoystickButtonState(joystick, i, state);
        }

        if (gamepad.axes[0] < -0.5 || gamepad.axes[1] < -0.5) {
            joystick.getLeft().toggle(true);
        }

        if (gamepad.axes[0] > 0.5 || gamepad.axes[1] > 0.5) {
            joystick.getRight().toggle(true);
        }

        if (gamepad.axes[2] < -0.5 || gamepad.axes[3] < -0.5) {
            joystick.getUp().toggle(true);
        }

        if (gamepad.axes[2] > 0.5 || gamepad.axes[3] > 0.5) {
            joystick.getDown().toggle(true);
        }
    }

    private _updateJoystickButtonState(
        joystick: DigitalJoystickInterface,
        button: MappingButton,
        value: boolean
    ): void {
        switch (button) {
            case MappingButton.left:
                return joystick.getLeft().toggle(value);

            case MappingButton.right:
                return joystick.getRight().toggle(value);

            case MappingButton.up:
                return joystick.getUp().toggle(value);

            case MappingButton.down:
                return joystick.getDown().toggle(value);

            case MappingButton.fire:
                return joystick.getFire().toggle(value);
        }
    }

    private _bound = false;
    private _joysticks: Array<DigitalJoystickInterface> = null;
    private _start: SwitchInterface = null;
    private _select: SwitchInterface = null;

}
