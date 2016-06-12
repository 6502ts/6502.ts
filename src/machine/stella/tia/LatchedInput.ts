import SwitchInterface from '../../io/SwitchInterface';

export default class LatchedInput {

    constructor(private _switch: SwitchInterface) {
        this.reset();
    }

    reset(): void {
        this._modeLatched = false;
        this._latchedValue = 0;
    }

    vblank(value: number): void {
        if ((value & 0x40) > 0) {
            this._modeLatched = true;
        } else {
            this._modeLatched = false;
            this._latchedValue = 0x80;
        }
    }

    inpt(): number {
        let value = this._switch.read() ? 0 : 0x80;

        if (this._modeLatched) {
            this._latchedValue &= value;
            value = this._latchedValue;
        }

        return value;
    }

    private _modeLatched = false;
    private _latchedValue = 0;

}
