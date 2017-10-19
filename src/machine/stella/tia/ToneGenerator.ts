/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
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

const FREQUENCY_DIVISIORS = new Int8Array([1, 1, 15, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1]);

// all ones
const POLY0 = new Int8Array([1]);

// 50% duty cycle
const POLY1 = new Int8Array([1, 1]);

// 16/31 duty cycle
const POLY2 = new Int8Array([16, 15]);

// 4 bit LFSR
const POLY4 = new Int8Array([1, 2, 2, 1, 1, 1, 4, 3]);

// 5 bit LFSR
const POLY5 = new Int8Array([1, 2, 1, 1, 2, 2, 5, 4, 2, 1, 3, 1, 1, 1, 1, 4]);

// 9 bit LFSR
const POLY9 = new Int8Array([
    1,
    4,
    1,
    3,
    2,
    4,
    1,
    2,
    3,
    2,
    1,
    1,
    1,
    1,
    1,
    1,
    2,
    4,
    2,
    1,
    4,
    1,
    1,
    2,
    2,
    1,
    3,
    2,
    1,
    3,
    1,
    1,
    1,
    4,
    1,
    1,
    1,
    1,
    2,
    1,
    1,
    2,
    6,
    1,
    2,
    2,
    1,
    2,
    1,
    2,
    1,
    1,
    2,
    1,
    6,
    2,
    1,
    2,
    2,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    7,
    2,
    3,
    2,
    2,
    1,
    1,
    1,
    3,
    2,
    1,
    1,
    2,
    1,
    1,
    7,
    1,
    1,
    3,
    1,
    1,
    2,
    3,
    3,
    1,
    1,
    1,
    2,
    2,
    1,
    1,
    2,
    2,
    4,
    3,
    5,
    1,
    3,
    1,
    1,
    5,
    2,
    1,
    1,
    1,
    2,
    1,
    2,
    1,
    3,
    1,
    2,
    5,
    1,
    1,
    2,
    1,
    1,
    1,
    5,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    6,
    1,
    1,
    1,
    2,
    1,
    1,
    1,
    1,
    4,
    2,
    1,
    1,
    3,
    1,
    3,
    6,
    3,
    2,
    3,
    1,
    1,
    2,
    1,
    2,
    4,
    1,
    1,
    1,
    3,
    1,
    1,
    1,
    1,
    3,
    1,
    2,
    1,
    4,
    2,
    2,
    3,
    4,
    1,
    1,
    4,
    1,
    2,
    1,
    2,
    2,
    2,
    1,
    1,
    4,
    3,
    1,
    4,
    4,
    9,
    5,
    4,
    1,
    5,
    3,
    1,
    1,
    3,
    2,
    2,
    2,
    1,
    5,
    1,
    2,
    1,
    1,
    1,
    2,
    3,
    1,
    2,
    1,
    1,
    3,
    4,
    2,
    5,
    2,
    2,
    1,
    2,
    3,
    1,
    1,
    1,
    1,
    1,
    2,
    1,
    3,
    3,
    3,
    2,
    1,
    2,
    1,
    1,
    1,
    1,
    1,
    3,
    3,
    1,
    2,
    2,
    3,
    1,
    3,
    1,
    8
]);

// used by mode 15
const POLY68 = new Int8Array([5, 6, 4, 5, 10, 5, 3, 7, 4, 10, 6, 3, 6, 4, 9, 6]);

// used by mode 3
const POLY465 = new Int8Array([
    2,
    3,
    2,
    1,
    4,
    1,
    6,
    10,
    2,
    4,
    2,
    1,
    1,
    4,
    5,
    9,
    3,
    3,
    4,
    1,
    1,
    1,
    8,
    5,
    5,
    5,
    4,
    1,
    1,
    1,
    8,
    4,
    2,
    8,
    3,
    3,
    1,
    1,
    7,
    4,
    2,
    7,
    5,
    1,
    3,
    1,
    7,
    4,
    1,
    4,
    8,
    2,
    1,
    3,
    4,
    7,
    1,
    3,
    7,
    3,
    2,
    1,
    6,
    6,
    2,
    2,
    4,
    5,
    3,
    2,
    6,
    6,
    1,
    3,
    3,
    2,
    5,
    3,
    7,
    3,
    4,
    3,
    2,
    2,
    2,
    5,
    9,
    3,
    1,
    5,
    3,
    1,
    2,
    2,
    11,
    5,
    1,
    5,
    3,
    1,
    1,
    2,
    12,
    5,
    1,
    2,
    5,
    2,
    1,
    1,
    12,
    6,
    1,
    2,
    5,
    1,
    2,
    1,
    10,
    6,
    3,
    2,
    2,
    4,
    1,
    2,
    6,
    10
]);

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

        // TODO rate depending on PAL/NTSC?
        const sampleRate = Config.getClockMhz(this._config) * 1000000 / 114;

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

export default ToneGenerator;
