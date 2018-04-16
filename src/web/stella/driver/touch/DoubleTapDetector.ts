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

import { Event } from 'microevent.ts';

class DoubleTapDetector {
    constructor(private _maxTapLength = 500, private _timeout = 200) {}

    startTouch(): void {
        this._lastTouchStart = Date.now();

        if (this._touching) {
            return;
        }

        this._touching = true;

        this._dispatch = this._lastTouchEligible && this._lastTouchStart - this._lastTouchEnd < this._timeout;
    }

    endTouch(): void {
        this._lastTouchEnd = Date.now();

        // We need to dispatch on touchend in order to enable the fullscreen API in chrome. wtf.
        if (this._dispatch) {
            this._dispatch = false;
            this.trigger.dispatch(undefined);
        }

        if (!this._touching) {
            return;
        }

        this._touching = false;

        this._lastTouchEligible = this._lastTouchStart - this._lastTouchEnd < this._maxTapLength;
    }

    cancelTouch(): void {
        this.endTouch();
        this._lastTouchEligible = false;
    }

    isDispatching(): boolean {
        return this._dispatch;
    }

    trigger = new Event<void>();

    private _dispatch = false;
    private _touching = false;
    private _lastTouchEligible = false;
    private _lastTouchStart = 0;
    private _lastTouchEnd = 0;
}

export default DoubleTapDetector;
