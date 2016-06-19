import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';

export default class Audio {

    constructor() {
        this.reset();
    }

    reset(): void {
        this._volume = 0;
        this._tone = 0;
        this._frequency = 0;
    }

    audc(value: number): void {

    }

    audf(value: number): void {

    }

    audv(value: number): void {

    }

    getOutputBuffer(): AudioOutputBuffer {
        // TODO length depending on PAL/NTSC or normalizing on 44.1 kHz?
        return new AudioOutputBuffer(new Float32Array(44100));
    }

    private _volume = 0;
    private _tone = 0;
    private _frequency = 0;

}
