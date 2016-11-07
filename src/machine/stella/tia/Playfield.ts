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

const enum ColorMode {normal, score};

class Playfield {

    constructor(private _collisionMask: number) {
        this.reset();
    }

    reset() {
        this._pattern = 0;
        this._reflected = false;
        this._refp = false;

        this._pf0 = 0;
        this._pf1 = 0;
        this._pf2 = 0;

        this._color = 0;
        this._colorP0 = 0;
        this._colorP1 = 0;
        this._colorMode = ColorMode.normal;
        this._applyColors();
    }

    pf0(value: number) {
        this._pattern = (this._pattern & 0x000FFFF0) | ((value & 0xF0) >>> 4);
    }

    pf1(value: number) {
        this._pattern = (this._pattern & 0x000FF00F)
            | ((value & 0x80) >>> 3)
            | ((value & 0x40) >>> 1)
            | ((value & 0x20) <<  1)
            | ((value & 0x10) <<  3)
            | ((value & 0x08) <<  5)
            | ((value & 0x04) <<  7)
            | ((value & 0x02) <<  9)
            | ((value & 0x01) <<  11);
    }

    pf2(value: number) {
        this._pattern = (this._pattern & 0x00000FFF) | ((value & 0xFF) << 12);
    }

    ctrlpf(value: number): void {
        this._reflected = (value & 0x01) > 0;
        this._colorMode = (value & 0x06) === 0x02 ? ColorMode.score : ColorMode.normal;
        this._applyColors();
    }

    setColor(color: number): void {
        this._color = color;
        this._applyColors();
    }

    setColorP0(color: number): void {
        this._colorP0 = color;
        this._applyColors();
    }

    setColorP1(color: number): void {
        this._colorP1 = color;
        this._applyColors();
    }


    tick(x: number) {
        this._x = 0;

        if (x === 80 || x === 0) {
            this._refp = this._reflected;
        }

        if (x & 0x03) {
            return;
        }

        let currentPixel: number;

        if (this._pattern === 0) {
            currentPixel = 0;
        } else if (x < 80) {
            currentPixel = this._pattern & (1 << (x >>> 2));
        } else if (this._refp) {
            currentPixel = this._pattern & (1 << (39 - (x >>> 2)));
        } else {
            currentPixel = this._pattern & (1 << ((x >>> 2) - 20));
        }

        this.collision = currentPixel ? 0 : this._collisionMask;
    }

    getPixel(colorIn: number): number {
        if (!this.collision) {
            return this._x < 80 ? this._colorLeft : this._colorRight;
        }

        return colorIn;
    }

    private _applyColors(): void {
        switch (this._colorMode) {
            case ColorMode.normal:
                this._colorLeft = this._colorRight = this._color;
                break;

            case ColorMode.score:
                this._colorLeft = this._colorP0;
                this._colorRight = this._colorP1;
                break;
        }
    }

    collision = 0;

    private _colorLeft = 0;
    private _colorRight = 0;
    private _color = 0;
    private _colorP0 = 0;
    private _colorP1 = 0;
    private _colorMode = ColorMode.normal;

    private _pattern = 0;
    private _refp = false;
    private _reflected = false;


    private _pf0 = 0;
    private _pf1 = 0;
    private _pf2 = 0;

    private _x = 0;
}

export default Playfield;
