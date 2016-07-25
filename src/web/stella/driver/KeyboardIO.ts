import SwitchInterface from '../../../machine/io/SwitchInterface';
import Event from '../../../tools/event/Event';
import JoystickInterface from '../../../machine/io/DigitalJoystickInterface';
import ControlPanelInterface from '../../../machine/stella/ControlPanelInterface';

export default class KeyboardIO {

    constructor(
        private _target: HTMLElement|HTMLDocument
    ) {}

    bind(
        joystick0: JoystickInterface,
        joystick1: JoystickInterface,
        controlPanel: ControlPanelInterface
    ): void {
        if (this._joystick0) {
            return;
        }

        this._joystick0 = joystick0;
        this._joystick1 = joystick1;
        this._controlPanel = controlPanel;

        const mappings = this._buildMappings();

        this._keydownListener = e => {
            if (mappings[e.keyCode]) {
                mappings[e.keyCode].toggle(true);
                e.preventDefault();

                return;
            }

            switch (e.keyCode) {
                case 13: // enter
                    this.toggleFullscreen.dispatch(undefined);
                    return;
            }
        };

        this._keyupListener = e => {
            if (mappings[e.keyCode]) {
                mappings[e.keyCode].toggle(false);
                e.preventDefault();

                return;
            }
        };

        this._target.addEventListener('keydown', this._keydownListener);
        this._target.addEventListener('keyup', this._keyupListener);
    }

    unbind(): void {
        if (!this._joystick0) {
            return;
        }

        this._target.removeEventListener('keydown', this._keydownListener);
        this._target.removeEventListener('keyup', this._keyupListener);

        this._joystick0 = this._joystick1 = this._controlPanel = null;
        this._keydownListener = this._keyupListener = null;
    }

    private _buildMappings(): Mappings {
        return {
            17: this._controlPanel.getSelectSwitch(),     // l-alt
            18: this._controlPanel.getResetButton(),      // l-ctrl
            65: this._joystick0.getLeft(),                // w
            37: this._joystick0.getLeft(),                // left
            68: this._joystick0.getRight(),               // d
            39: this._joystick0.getRight(),               // right
            83: this._joystick0.getDown(),                // s
            40: this._joystick0.getDown(),                // down
            87: this._joystick0.getUp(),                  // w
            38: this._joystick0.getUp(),                  // up
            86: this._joystick0.getFire(),                // v
            32: this._joystick0.getFire(),                // space
            74: this._joystick1.getLeft(),                // j,
            76: this._joystick1.getRight(),               // l,
            73: this._joystick1.getUp(),                  // i,
            75: this._joystick1.getDown(),                // k
            66: this._joystick1.getFire(),                // b
        };
    }

    toggleFullscreen = new Event<void>();

    private _keydownListener: (e: KeyboardEvent) => void = null;
    private _keyupListener: (e: KeyboardEvent) => void = null;

    private _joystick0: JoystickInterface = null;
    private _joystick1: JoystickInterface = null;
    private _controlPanel: ControlPanelInterface = null;
}

interface Mappings {
    [key: number]: SwitchInterface;
}
