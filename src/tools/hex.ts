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

function encodeWithPrefix(value: number, width?: number, signed = true, prefix = ''): string {
    if (!signed && value < 0) {
        return (
            encodeWithPrefix(value >>> 16, width && width > 8 ? width - 4 : 4, false, prefix) +
            encodeWithPrefix(value & 0xffff, 4)
        );
    }

    let result = Math.abs(value)
        .toString(16)
        .toUpperCase();

    if (typeof width !== 'undefined') {
        while (result.length < width) {
            result = '0' + result;
        }
    }

    return (value < 0 ? '-' : '') + prefix + result;
}

export function encode(value: number, width?: number, signed = true): string {
    return encodeWithPrefix(value, width, signed, '$');
}

export function decode(value: string): number {
    const sign = value.match(/^-/) ? -1 : 1;

    let stripped = value.replace(/^-/, '').toUpperCase();

    if (stripped.match(/^0X[0-9A-F]+$/)) {
        stripped = stripped.replace(/^0x/, '');
    } else if (stripped.match(/^\$[0-9A-F]+$/)) {
        stripped = stripped.replace(/^\$/, '');
    } else {
        throw new TypeError('invalid hex number ' + value);
    }

    return sign * parseInt(stripped, 16);
}
