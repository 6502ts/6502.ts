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

import Switch from '../../../machine/io/SwitchInterface';
import { clearTimeout } from 'timers';

class DoubleTapDemux {
    constructor(private _timeout = 100) {}

    setSwitch(swtch: Switch): this {
        this._switch = swtch;

        return this;
    }

    touchStart(): void {
        if (this._touch) {
            return;
        }

        if (this._doubleTapTimer !== null) {
            clearTimeout(this._doubleTapTimer);
            this._doubleTapTimer = null;
        }

        if (this._startTimer !== null) {
            clearTimeout(this._startTimer);
        }

        this._touch = true;
        this._lastStart = Date.now();

        this._startTimer = setTimeout(this._onTimeoutExpired, this._timeout);

        this._dblTouchPending = this._lastStart - this._lastStop <= this._timeout;
    }

    touchStop(): void {
        if (!this._touch) {
            return;
        }

        if (this._startTimer !== null) {
            clearTimeout(this._startTimer);
            this._startTimer = null;
        }

        if (this._doubleTapTimer !== null) {
            clearTimeout(this._doubleTapTimer);
            this._doubleTapTimer = null;
        }

        this._lastStop = Date.now();

        if (this._dblTouchPending) {
            this.doubleTap.dispatch(undefined);
        }
        this._dblTouchPending = false;

        const duration = this._lastStop - this._lastStart;

        if (duration <= this._timeout) {
            this._doubleTapTimer = setTimeout(this._onDoubleTapExpired, this._timeout);
        } else {
            this._switchOff(this._timeout);
        }
    }

    private _switchOn(): void {
        if (this._stopTimer !== null) {
            clearTimeout(this._stopTimer);
            this._stopTimer = null;
        }

        if (this._switch) {
            this._switch.toggle(true);
        }
    }

    private _switchOff(delay = 0): void {
        if (this._stopTimer !== null) {
            clearTimeout(this._stopTimer);
            this._stopTimer = null;
        }

        if (delay > 0) {
            this._stopTimer = setTimeout(delay, this._onStopExpired);
        } else if (this._switch) {
            this._switch.toggle(false);
        }
    }

    private _onTimeoutExpired = () => {
        this._startTimer = null;

        this._dblTouchPending = false;

        if (!this._touch) {
            return;
        }

        this._switchOn();
    };

    private _onStopExpired = () => {
        this._stopTimer = null;

        if (this._switch) {
            this._switch.toggle(false);
        }
    };

    private _onDoubleTapExpired = () => {
        this._startTimer();
        this._stopTimer(this._lastStop - this._lastStart);
    };

    doubleTap = new Event<void>();

    private _switch: Switch = null;

    private _touch = false;
    private _dblTouchPending = false;

    private _lastStart = 0;
    private _lastStop = 0;

    private _startTimer: any = null;
    private _stopTimer: any = null;
    private _doubleTapTimer: any = null;
}

export default DoubleTapDemux;
