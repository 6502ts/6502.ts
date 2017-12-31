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

export default SwitchProxy;
