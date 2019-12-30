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

const enum ColorMode {
    normal,
    score
}

class Playfield {
    constructor(private _collisionMask: number, private _flushLineCache: () => void) {
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
        if (this._pf0 === value >>> 4) {
            return;
        }

        this._flushLineCache();
        this._pf0 = value >>> 4;

        this._pattern = (this._pattern & 0x000ffff0) | this._pf0;
    }

    pf1(value: number) {
        if (this._pf1 === value) {
            return;
        }

        this._flushLineCache();
        this._pf1 = value;

        this._pattern =
            (this._pattern & 0x000ff00f) |
            ((value & 0x80) >>> 3) |
            ((value & 0x40) >>> 1) |
            ((value & 0x20) << 1) |
            ((value & 0x10) << 3) |
            ((value & 0x08) << 5) |
            ((value & 0x04) << 7) |
            ((value & 0x02) << 9) |
            ((value & 0x01) << 11);
    }

    pf2(value: number) {
        if (this._pf2 === value) {
            return;
        }

        this._flushLineCache();
        this._pf2 = value;

        this._pattern = (this._pattern & 0x00000fff) | ((value & 0xff) << 12);
    }

    ctrlpf(value: number): void {
        const reflected = (value & 0x01) > 0,
            colorMode = (value & 0x06) === 0x02 ? ColorMode.score : ColorMode.normal;

        if (reflected === this._reflected && colorMode === this._colorMode) {
            return;
        }

        this._flushLineCache();

        this._reflected = reflected;
        this._colorMode = colorMode;

        this._applyColors();
    }

    setColor(color: number): void {
        if (color !== this._color && this._colorMode === ColorMode.normal) {
            this._flushLineCache();
        }

        this._color = color;
        this._applyColors();
    }

    setColorP0(color: number): void {
        if (color !== this._colorP0 && this._colorMode === ColorMode.score) {
            this._flushLineCache();
        }

        this._colorP0 = color;
        this._applyColors();
    }

    setColorP1(color: number): void {
        if (color !== this._colorP1 && this._colorMode === ColorMode.score) {
            this._flushLineCache();
        }

        this._colorP1 = color;
        this._applyColors();
    }

    tick(x: number) {
        this._x = x;

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

export { Playfield as default };
