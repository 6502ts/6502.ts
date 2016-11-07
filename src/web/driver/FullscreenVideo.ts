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


import * as screenfull from 'screenfull';

export default class FullscreenVideoDriver {

    constructor(private _element: HTMLElement) {}

    engage(): void {
        screenfull.request(this._element);
        this._adjustSize();
    }

    disengage(): void {
        screenfull.exit();
        this._adjustSize();
    }

    toggle(): void {
        screenfull.toggle(this._element);
        this._adjustSize();
    }

    isEngaged(): boolean {
        return screenfull.isFullscreen;
    }

    private _adjustSize() {
        if (!this.isEngaged()) {
            return;
        }

        window.addEventListener('resize', this._resizeListener);
    }

    private _adjustSizeForFullscreen() {
        if (!this.isEngaged()) {
            window.removeEventListener('resize', this._resizeListener);

            this._element.style.width = '';
            this._element.style.height = '';
            return;
        }

        const actualWidth = window.innerWidth,
            actualHeight = window.innerHeight;

        let correctedWidth: number, correctedHeight: number;

        if (actualWidth > actualHeight) {
            correctedHeight = actualHeight;
            correctedWidth = actualHeight / 3 * 4;
        } else {
            correctedWidth = actualWidth;
            correctedHeight = actualHeight / 4 * 3;
        }

        this._element.style.width = correctedWidth + 'px';
        this._element.style.height = correctedHeight + 'px';
    }

    private _resizeListener: () => void = this._adjustSizeForFullscreen.bind(this);

}
