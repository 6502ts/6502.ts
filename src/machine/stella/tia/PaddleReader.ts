import Paddle from '../../io/Paddle';
const C = 68e-9,
    RPOT = 1e6,
    R0 = 1.8e3,
    U = 5,
    LINES_FULL = 380;

/*
function exp(x: number): number {
    return Math.exp(x);
}
*/
export default class PaddleReader {

    constructor(protected _clockFreq: number, paddle: Paddle) {
        this._uThresh = U * (1 - Math.exp(-LINES_FULL * 228 / this._clockFreq  / (RPOT + R0) / C));
        paddle.valueChanged.addHandler((value: number) => this._value = value);

        this.reset();
    }

    reset(): void {
        this._u = 0;
        this._value = 0.5;
        this._dumped = false;
    }

    vblank(value: number): void {
        if (value & 0x40) {
            this._dumped = true;
            this._u = 0;
        } else {
            this._dumped = false;
        }
    }

    inpt(): number {
        const state = this._dumped ? false : this._u >= this._uThresh;

        return state ? 0x80 : 0;
    }

    tick() {
        this._u += (U - this._u) / (RPOT * this._value + R0) / C / this._clockFreq;
    }

    setValue(value: number): void {
        this._value = value;
    }

    protected _uThresh = 0;
    protected _u = 0;
    protected _dumped = false;
    protected _value = 0.5;

}
