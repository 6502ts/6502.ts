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
