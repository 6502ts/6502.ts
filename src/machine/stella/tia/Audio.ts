import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import AudioOutputInterface from '../../io/AudioOutputInterface';
import Event from '../../../tools/event/Event';
import Config from '../Config';
import ToneGenerator from './ToneGenerator.ts';

export default class Audio implements AudioOutputInterface {

    constructor(private _config: Config ) {
        this._toneGenerator = new ToneGenerator(this._config);

        this.reset();
    }

    reset(): void {
        this._volume = -1;
        this._tone = -1;
        this._frequency = -1;
    }

    audc(value: number): void {
        value &= 0x0F;

        if (value === this._tone) {
            return;
        }

        this._tone = value;
        this._dispatchBufferChanged();
    }

    audf(value: number): void {
        value &= 0x1F;

        if (value === this._frequency) {
            return;
        }

        this._frequency = value;
        this._dispatchBufferChanged();
    }

    audv(value: number): void {
        value &= 0x0F;

        if (value === this._volume) {
            return;
        }

        this._volume = value / 15;
        this.volumeChanged.dispatch(this._volume);
    }

    setActive(active: boolean): void {
        this._active = active;

        if (active) {
            this._dispatchBufferChanged();
        } else {
            this.stop.dispatch(undefined);
        }
    }

    getVolume(): number {
        return this._volume >= 0 ? this._volume : 0;
    }

    getBuffer(key: number): AudioOutputBuffer {

        return this._toneGenerator.getBuffer(key);
    }

    protected _getKey(): number {
        return this._toneGenerator.getKey(this._tone, this._frequency);
    }

    protected _dispatchBufferChanged() {
        if (this._active && this.bufferChanged.hasHandlers) {
            this.bufferChanged.dispatch(this._getKey());
        }
    }

    bufferChanged = new Event<number>();
    volumeChanged = new Event<number>();
    stop = new Event<void>();

    private _volume = -1;
    private _tone = -1;
    private _frequency = -1;
    private _active = false;
    private _toneGenerator: ToneGenerator = null;

}
