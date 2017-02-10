/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

const
    decodes0 = new Uint8Array(160),
    decodes1 = new Uint8Array(160),
    decodes2 = new Uint8Array(160),
    decodes3 = new Uint8Array(160),
    decodes4 = new Uint8Array(160),
    decodes6 = new Uint8Array(160);

export const decodesMissile: Array<Uint8Array> = [
    decodes0,
    decodes1,
    decodes2,
    decodes3,
    decodes4,
    decodes0,
    decodes6,
    decodes0
];

export const decodesPlayer: Array<Uint8Array> = [
    decodes0,
    decodes1,
    decodes2,
    decodes3,
    decodes4,
    decodes0,
    decodes6,
    decodes0
];

[
    decodes0,
    decodes1,
    decodes2,
    decodes3,
    decodes4,
    decodes6
].forEach(decodes => {
    for (let i = 0; i < 160; i++) {
        decodes[i] = 0;
    }

    decodes[156] = 1;
});

decodes1[12] = 1;
decodes2[28] = 1;
decodes3[12] = decodes3[28] = 1;
decodes4[60] = 1;
decodes6[28] = decodes6[60] = 1;
