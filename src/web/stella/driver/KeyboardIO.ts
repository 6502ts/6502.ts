import Board from '../../../machine/stella/Board';
import SwitchInterface from '../../../machine/io/SwitchInterface';
import Event from '../../../tools/event/Event';

export default class KeyboardIO {

    constructor(
        private _target: HTMLElement|HTMLDocument
    ) {}

    bind(board: Board): void {
        if (this._board) {
            return;
        }

        this._board = board;

        const mappings = this._buildMappings(board);

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
        if (!this._board) {
            return;
        }

        this._target.removeEventListener('keydown', this._keydownListener);
        this._target.removeEventListener('keyup', this._keyupListener);

        this._board = this._keydownListener = this._keyupListener = null;
    }

    private _buildMappings(board: Board): Mappings {
        const controlPanel = board.getControlPanel(),
            joystick0 = board.getJoystick0(),
            joystick1 = board.getJoystick0();

        return {
            17: controlPanel.getSelectSwitch(),     // l-alt
            18: controlPanel.getResetButton(),      // l-ctrl
            65: joystick0.getLeft(),                // w
            37: joystick0.getLeft(),                // left
            68: joystick0.getRight(),               // d
            39: joystick0.getRight(),               // right
            83: joystick0.getDown(),                // s
            40: joystick0.getDown(),                // down
            87: joystick0.getUp(),                  // w
            38: joystick0.getUp(),                  // up
            86: joystick0.getFire(),                // v
            32: joystick0.getFire(),                // space
            74: joystick1.getLeft(),                // j,
            76: joystick1.getRight(),               // l,
            73: joystick1.getUp(),                  // i,
            75: joystick1.getDown(),                // k
            66: joystick1.getFire(),                // b
        };
    }

    toggleFullscreen = new Event<void>();

    private _keydownListener: (e: KeyboardEvent) => void = null;
    private _keyupListener: (e: KeyboardEvent) => void = null;
    private _board: Board = null;
}

interface Mappings {
    [key: number]: SwitchInterface;
}
