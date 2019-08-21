/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import screenfull from 'screenfull';

import VideoDriver from './VideoDriverInterface';

const noFullscrenApi = !!navigator.platform.match(/iPhone|iPad|iPod/);

export default class FullscreenVideoDriver {
    constructor(
        private _videoDriver: VideoDriver,
        private _zIndex = 100000,
        private _fullscreenClass = 'stellerator-fullscreen'
    ) {}

    engage(): void {
        if (this._engaged) {
            return;
        }

        this._engaged = true;

        if (noFullscrenApi || !screenfull) {
            this._adjustSizeForFullscreen();
            window.addEventListener('resize', this._resizeListener);
            this._engaged = true;
        } else {
            screenfull.on('change', this._changeListener);
            screenfull.request(this._videoDriver.getCanvas());
        }
    }

    disengage(): void {
        if (!this._engaged) {
            return;
        }

        if (noFullscrenApi || !screenfull) {
            this._resetSize();
            window.removeEventListener('resize', this._resizeListener);
            this._engaged = false;
        } else {
            screenfull.exit();
        }
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
        if (!screenfull) {
            return;
        }

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

        if (this._resizeHandle) {
            clearTimeout(this._resizeHandle);
            this._resizeHandle = null;
        }

        element.style.width = '';
        element.style.height = '';
        element.style.maxWidth = '';
        element.style.maxHeight = '';

        if (noFullscrenApi) {
            element.style.position = '';
            element.style.top = '';
            element.style.left = '';
            element.style.zIndex = '';
        }

        document.body.classList.remove(this._fullscreenClass);

        setTimeout(() => this._videoDriver.resize(), 0);
    }

    private _adjustSizeForFullscreen() {
        const element = this._videoDriver.getCanvas();

        this._videoDriver.resize(window.innerWidth, window.innerHeight);
        element.style.width = window.innerWidth + 'px';
        element.style.height = window.innerHeight + 'px';
        element.style.maxWidth = window.innerWidth + 'px';
        element.style.maxHeight = window.innerHeight + 'px';

        if (noFullscrenApi) {
            element.style.position = 'fixed';
            element.style.top = '0';
            element.style.left = '0';
            element.style.zIndex = '' + this._zIndex;
        }

        document.body.classList.add(this._fullscreenClass);
    }

    private _resizeListener = () => {
        if (this._resizeHandle) {
            return;
        }

        this._resizeHandle = setTimeout(() => {
            this._resizeHandle = null;
            this._adjustSizeForFullscreen();
        }, 100);
    };

    private _resizeHandle: any = null;

    private _changeListener: () => void = this._onChange.bind(this);

    private _engaged = false;
}
