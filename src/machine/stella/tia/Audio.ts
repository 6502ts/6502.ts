import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';

const FREQUENCY_DIVISIORS = new Int8Array([
    1, 1, 15, 1,
    1, 1, 1, 1,
    1, 1, 1, 1,
    3, 3, 3, 1
]);

// all ones
const POLY0 = new Int8Array([ 1, -1 ]);

// 50% duty cycle
const POLY1 = new Int8Array([ 1, 1, -1 ]);

// 16/31 duty cycle
const POLY2 = new Int8Array([ 16, 15, -1 ]);

// 4 bit LFSR
const POLY4 = new Int8Array([ 1, 2, 2, 1, 1, 1, 4, 3, -1 ]);

// 5 bit LFSR
const POLY5 = new Int8Array([ 1, 2, 1, 1, 2, 2, 5, 4, 2, 1, 3, 1, 1, 1, 1, 4, -1 ]);

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
    2, 1, 1, 1, 1, 1, 3, 3, 1, 2, 2, 3, 1, 3, 1, 8,
    -1
]);

// used by mode 15
const POLY68 = new Int8Array([ 5, 6, 4, 5, 10, 5, 3, 7, 4, 10, 6, 3, 6, 4, 9, 6, -1 ]);

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
    3, 2, 2, 4, 1, 2, 6, 10, -1
]);

const POLYS = [
    POLY0, POLY4, POLY4, POLY465,
    POLY1, POLY1, POLY2, POLY5,
    POLY9, POLY5, POLY2, POLY0,
    POLY1, POLY1, POLY2, POLY68
];

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
        this._tone = (value & 0x0F);
    }

    audf(value: number): void {
        this._frequency = (value & 0x1F);
    }

    audv(value: number): void {
        this._volume = (value & 0x0F);
    }

    getOutputBuffer(): AudioOutputBuffer {
        // TODO length depending on PAL/NTSC or normalizing on 44.1 kHz?
        const length = 44100;
        const content = new Float32Array(length);

        // TODO rate depending on PAL/NTSC?
        const sampleRate = 31456;

        let size = length;
        let f = 0;
        let count = 0;
        let offset = 0;
        let last = true;
        let rate = 0;

        let i = 0;

        const poly = POLYS[this._tone];

        while (size > 0) {
            f++;

            if (f === FREQUENCY_DIVISIORS[this._tone] * (this._frequency + 1)) {
                f = 0;
                count++;

                if (count === poly[offset]) {
                    offset++;
                    count = 0;

                    if (poly[offset] === -1) {
                        offset = 0;
                    }
                }

                last = !(offset & 0x01);
            }

            rate += 44100;


            while (rate >= sampleRate && size > 0) {
                content[i] = (last ? (this._volume << 3) : 0);
                rate -= sampleRate;

                i++;
                size--;
            }
        }

        return new AudioOutputBuffer(content);
    }

    private _volume = 0;
    private _tone = 0;
    private _frequency = 0;

}
