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

import _screenfull, { Screenfull } from 'screenfull';

import VideoDriver from './Video';
import { isIOS } from '../../tools/browser';

const noFullscrenApi = isIOS;
const screenfull = _screenfull as Screenfull;

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
