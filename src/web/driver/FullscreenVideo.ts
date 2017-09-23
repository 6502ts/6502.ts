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

import * as screenfull from 'screenfull';
import VideoDriver from './VideoDriverInterface';

export default class FullscreenVideoDriver {

    constructor(private _videoDriver: VideoDriver) {}

    engage(): void {
        if (this._engaged) {
            return;
        }

        this._engaged = true;

        screenfull.on('change', this._changeListener);
        screenfull.request(this._videoDriver.getCanvas());
    }

    disengage(): void {
        if (!this._engaged) {
            return;
        }

        screenfull.exit();
    }

    toggle(): void {
        if (this._engaged) {
            this.disengage();
        } else {
            this.engage();
        }
    }

    isEngaged(): boolean {
        return this._engaged;
    }

    private _onChange(): void {
        if (screenfull.isFullscreen) {
            window.addEventListener('resize', this._resizeListener);
            this._adjustSizeForFullscreen();
        } else {
            this._resetSize();
            window.removeEventListener('resize', this._resizeListener);
            screenfull.off('change', this._changeListener);

            this._engaged = false;
        }
    }

    private _resetSize() {
        const element = this._videoDriver.getCanvas();

        element.style.width = '';
        element.style.height = '';

        setTimeout(() => this._videoDriver.resize(), 0);
    }

    private _adjustSizeForFullscreen() {
        const element = this._videoDriver.getCanvas();

        this._videoDriver.resize(window.innerWidth, window.innerHeight);
        element.style.width = window.innerWidth + 'px';
        element.style.height = window.innerHeight + 'px';
    }

    private _resizeListener: () => void = this._adjustSizeForFullscreen.bind(this);

    private _changeListener: () => void = this._onChange.bind(this);

    private _engaged = false;

}
