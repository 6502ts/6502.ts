import SwitchInterface from '../../io/SwitchInterface';

export default class LatchedInput {

    constructor(private _switch: SwitchInterface) {
        this.reset();

        this._switch.stateChanged.addHandler((state: boolean) => {
            if (this._modeLatched && !state) {
                this._latchedValue = 0x80;
            }
        });
    }

    reset(): void {
        this._modeLatched = false;
        this._latchedValue = 0;
    }

    vblank(value: number): void {
        if ((value & 0x40) > 0) {
            if (!this._modeLatched) {
                this._modeLatched = true;
                this._latchedValue = 0;
            }
        } else {
            this._modeLatched = false;
        }
    }

    inpt(): number {
        if (this._modeLatched) {
            return this._latchedValue;
        } else {
            return this._switch.read() ? 0 : 0x80;
        }
    }

    private _modeLatched = false;
    private _latchedValue = 0;

}
