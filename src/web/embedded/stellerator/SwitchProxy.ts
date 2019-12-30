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

import Switch from './Switch';
import SwitchIO from '../../../machine/io/SwitchInterface';

class SwitchProxy implements Switch {
    bind(swtch: SwitchIO): void {
        this.unbind();

        this._boundSwitch = swtch;
        this._boundSwitch.toggle(this._state);

        this._boundSwitch.stateChanged.addHandler(SwitchProxy._onBoundStateChange, this);
        this._setState(this._boundSwitch.read());
    }

    unbind(): void {
        if (!this._boundSwitch) {
            return;
        }

        this._boundSwitch.stateChanged.removeHandler(SwitchProxy._onBoundStateChange, this);
        this._boundSwitch = null;
    }

    toggle(state: boolean): this {
        if (this._boundSwitch) {
            this._boundSwitch.toggle(state);
        } else {
            this._setState(state);
        }

        return this;
    }

    read(): boolean {
        return this._state;
    }

    private static _onBoundStateChange(newState: boolean, self: SwitchProxy) {
        self._setState(newState);
    }

    private _setState(newState: boolean) {
        if (newState !== this._state) {
            this._state = newState;
            this.stateChange.dispatch(this._state);
        }
    }

    stateChange = new Event<boolean>();

    private _state = false;
    private _boundSwitch: SwitchIO = null;
}

export { SwitchProxy as default };
