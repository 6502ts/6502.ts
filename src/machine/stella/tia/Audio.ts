import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import AudioOutputInterface from '../../io/AudioOutputInterface';
import Event from '../../../tools/event/Event';
import Config from '../Config';

const FREQUENCY_DIVISIORS = new Int8Array([
    1, 1, 15, 1,
    1, 1, 1, 1,
    1, 1, 1, 1,
    3, 3, 3, 1
]);

// all ones
const POLY0 = new Int8Array([ 1 ]);

// 50% duty cycle
const POLY1 = new Int8Array([ 1, 1 ]);

// 16/31 duty cycle
const POLY2 = new Int8Array([ 16, 15 ]);

// 4 bit LFSR
const POLY4 = new Int8Array([ 1, 2, 2, 1, 1, 1, 4, 3 ]);

// 5 bit LFSR
const POLY5 = new Int8Array([ 1, 2, 1, 1, 2, 2, 5, 4, 2, 1, 3, 1, 1, 1, 1, 4 ]);

// 9 bit LFSR
const POLY9 = new Int8Array([
    1, 4, 1, 3, 2, 4, 1, 2, 3, 2, 1, 1, 1, 1, 1, 1,
    2, 4, 2, 1, 4, 1, 1, 2, 2, 1, 3, 2, 1, 3, 1, 1,
    1, 4, 1, 1, 1, 1, 2, 1, 1, 2, 6, 1, 2, 2, 1, 2,
    1, 2, 1, 1, 2, 1, 6, 2, 1, 2, 2, 1, 1, 1, 1, 2,
    2, 2, 2, 7, 2, 3, 2, 2, 1, 1, 1, 3, 2, 1, 1, 2,
    1, 1, 7, 1, 1, 3, 1, 1, 2, 3, 3, 1, 1, 1, 2, 2,
    1, 1, 2, 2, 4, 3, 5, 1, 3, 1, 1, 5, 2, 1, 1, 1,
    2, 1, 2, 1, 3, 1, 2, 5, 1, 1, 2, 1, 1, 1, 5, 1,
    1, 1, 1, 1, 1, 1, 1, 6, 1, 1, 1, 2, 1, 1, 1, 1,
    4, 2, 1, 1, 3, 1, 3, 6, 3, 2, 3, 1, 1, 2, 1, 2,
    4, 1, 1, 1, 3, 1, 1, 1, 1, 3, 1, 2, 1, 4, 2, 2,
    3, 4, 1, 1, 4, 1, 2, 1, 2, 2, 2, 1, 1, 4, 3, 1,
    4, 4, 9, 5, 4, 1, 5, 3, 1, 1, 3, 2, 2, 2, 1, 5,
    1, 2, 1, 1, 1, 2, 3, 1, 2, 1, 1, 3, 4, 2, 5, 2,
    2, 1, 2, 3, 1, 1, 1, 1, 1, 2, 1, 3, 3, 3, 2, 1,
    2, 1, 1, 1, 1, 1, 3, 3, 1, 2, 2, 3, 1, 3, 1, 8
]);

// used by mode 15
const POLY68 = new Int8Array([ 5, 6, 4, 5, 10, 5, 3, 7, 4, 10, 6, 3, 6, 4, 9, 6 ]);

// used by mode 3
const POLY465 = new Int8Array([
    2, 3, 2, 1, 4, 1, 6, 10, 2, 4, 2, 1, 1, 4, 5,
    9, 3, 3, 4, 1, 1, 1, 8, 5, 5, 5, 4, 1, 1, 1,
    8, 4, 2, 8, 3, 3, 1, 1, 7, 4, 2, 7, 5, 1, 3,
    1, 7, 4, 1, 4, 8, 2, 1, 3, 4, 7, 1, 3, 7, 3,
    2, 1, 6, 6, 2, 2, 4, 5, 3, 2, 6, 6, 1, 3, 3,
    2, 5, 3, 7, 3, 4, 3, 2, 2, 2, 5, 9, 3, 1, 5,
    3, 1, 2, 2, 11, 5, 1, 5, 3, 1, 1, 2, 12, 5, 1,
    2, 5, 2, 1, 1, 12, 6, 1, 2, 5, 1, 2, 1, 10, 6,
    3, 2, 2, 4, 1, 2, 6, 10
]);

const POLYS = [
    POLY0, POLY4, POLY4, POLY465,
    POLY1, POLY1, POLY2, POLY5,
    POLY9, POLY5, POLY2, POLY0,
    POLY1, POLY1, POLY2, POLY68
];

export default class Audio implements AudioOutputInterface {

    constructor(private _config: Config ) {
        this.reset();
    }

    reset(): void {
        this._volume = 0;
        this._tone = 0;
        this._frequency = 0;
    }

    audc(value: number): void {
        this._tone = (value & 0x0F);
        this._dispatchBufferChanged();
    }

    audf(value: number): void {
        this._frequency = (value & 0x1F);
        this._dispatchBufferChanged();
    }

    audv(value: number): void {
        this._volume = (value & 0x0F);
        this._dispatchBufferChanged();
    }

    setActive(active: boolean): void {
        this._active = active;

        if (active) {
            this._dispatchBufferChanged();
        } else {
            this.stop.dispatch(undefined);
        }
    }

    getBuffer(key: number): AudioOutputBuffer {
        const tone = (key >>> 9) & 0x0F,
            volume = (key >>> 5) & 0x0F,
            frequency = key & 0x1F;

        const poly = POLYS[tone];

        let length = 0;
        for (let i = 0; i < poly.length; i++) {
            length += poly[i];
        }

        length = length * FREQUENCY_DIVISIORS[tone] * (frequency + 1);

        const content = new Float32Array(length);

        // TODO rate depending on PAL/NTSC?
        const sampleRate = this._config.tvMode === Config.TvMode.ntsc ? 31400 : 31113;

        let f = 0;
        let count = 0;
        let offset = 0;
        let state = true;

        for (let i = 0; i < length; i++) {
            f++;

            if (f === FREQUENCY_DIVISIORS[tone] * (frequency + 1)) {
                f = 0;
                count++;

                if (count === poly[offset]) {
                    offset++;
                    count = 0;

                    if (poly.length === offset) {
                        offset = 0;
                    }
                }

                state = !(offset & 0x01);
            }

            content[i] = (state ? 1 : -1) * (volume / 15);
        }

        return new AudioOutputBuffer(content, sampleRate);
    }

    protected _getKey(): number {
        return (this._tone << 9) | (this._volume << 5) | this._frequency;
    }

    protected _dispatchBufferChanged() {
        if (this._active && this.bufferChanged.hasHandlers) {
            this.bufferChanged.dispatch(this._getKey());
        }
    }

    bufferChanged = new Event<number>();
    stop = new Event<void>();

    private _volume = 0;
    private _tone = 0;
    private _frequency = 0;
    private _active = false;

}
