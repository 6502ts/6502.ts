/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

/*
 * The tone generator has been heavily influenced by the code found at
 * http://www.biglist.com/lists/stella/archives/200311/msg00156.html with following licence:
 *
 * sound.c
 * version 0.2
 *
 * Copyright (c) 2003 Adam Wozniak (adam@wozniakconsulting.com)
 * All Rights Reserved
 *
 * Permission granted to freely copy and use for any purpose, provided
 * this copyright header remains intact.
 */
import Config from '../Config';
import AudioOutputBuffer from '../../../tools/AudioOutputBuffer';
import { decode as decodeBase64 } from '../../../tools/base64';

const FREQUENCY_DIVISIORS = decodeBase64('AQEPAQEBAQEBAQEBAwMDAQ==');

// all ones
const POLY0 = new Int8Array([1]);

// 50% duty cycle
const POLY1 = new Int8Array([1, 1]);

// 16/31 duty cycle
const POLY2 = new Int8Array([16, 15]);

// 4 bit LFSR
const POLY4 = decodeBase64('AQICAQEBBAM=');

// 5 bit LFSR
const POLY5 = decodeBase64('AQIBAQICBQQCAQMBAQEBBA==');

// 9 bit LFSR
const POLY9 = decodeBase64(
    'AQQBAwIEAQIDAgEBAQEBAQIEAgEEAQECAgEDAgEDAQEBBAEBAQECAQECBgECAgECAQIBAQIBBg' +
        'IBAgIBAQEBAgICAgcCAwICAQEBAwIBAQIBAQcBAQMBAQIDAwEBAQICAQECAgQDBQEDAQEFAgEB' +
        'AQIBAgEDAQIFAQECAQEBBQEBAQEBAQEBBgEBAQIBAQEBBAIBAQMBAwYDAgMBAQIBAgQBAQEDAQ' +
        'EBAQMBAgEEAgIDBAEBBAECAQICAgEBBAMBBAQJBQQBBQMBAQMCAgIBBQECAQEBAgMBAgEBAwQC' +
        'BQICAQIDAQEBAQECAQMDAwIBAgEBAQEBAwMBAgIDAQMBCA=='
);

// used by mode 15
const POLY68 = decodeBase64('BQYEBQoFAwcECgYDBgQJBg==');

// used by mode 3
const POLY465 = decodeBase64(
    'AgMCAQQBBgoCBAIBAQQFCQMDBAEBAQgFBQUEAQEBCAQCCAMDAQEHBAIHBQEDAQcEAQQIAgEDBA' +
        'cBAwcDAgEGBgICBAUDAgYGAQMDAgUDBwMEAwICAgUJAwEFAwECAgsFAQUDAQECDAUBAgUCAQEM' +
        'BgECBQECAQoGAwICBAECBgo='
);

const POLYS = [
    POLY0,
    POLY4,
    POLY4,
    POLY465,
    POLY1,
    POLY1,
    POLY2,
    POLY5,
    POLY9,
    POLY5,
    POLY2,
    POLY0,
    POLY1,
    POLY1,
    POLY2,
    POLY68
];

class ToneGenerator {
    constructor(private _config?: Config) {}

    setConfig(config: Config) {
        this._config = config;
    }

    getKey(tone: number, frequency: number): number {
        // Hack: this is at the boundary of hearing anyway and causes nasty artifacts during
        // resampling, so we kill it right away.
        if (POLYS[tone] === POLY1 && FREQUENCY_DIVISIORS[tone] * (frequency + 1) === 1) {
            return 0;
        }

        return (tone << 5) | frequency;
    }

    getBuffer(key: number): AudioOutputBuffer {
        const tone = (key >>> 5) & 0x0f,
            frequency = key & 0x1f;

        const poly = POLYS[tone];

        let length = 0;
        for (let i = 0; i < poly.length; i++) {
            length += poly[i];
        }

        length = length * FREQUENCY_DIVISIORS[tone] * (frequency + 1);

        const content = new Float32Array(length);

        const sampleRate = Config.getClockHz(this._config) / 114;

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

            content[i] = state ? 1 : -1;
        }

        return new AudioOutputBuffer(content, sampleRate);
    }
}

export { ToneGenerator as default };
