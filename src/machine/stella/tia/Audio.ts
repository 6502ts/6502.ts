export default class Audio {

    constructor() {
        this.reset();
    }

    reset(): void {
        this._volume = 0;
        this._tone = 0;
        this._frequency = 0;
    }

    private _volume = 0;
    private _tone = 0;
    private _frequency = 0;

}
