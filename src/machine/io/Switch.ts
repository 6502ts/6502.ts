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

import {Event} from 'microevent.ts';

import SwitchInterface from './SwitchInterface';

export default class Switch implements SwitchInterface {

    constructor(private _state: boolean = false) {}

    read(): boolean {
        this.beforeRead.dispatch(this);
        return this._state;
    }

    peek(): boolean {
        return this._state;
    }

    toggle(state: boolean): void {
        if (this._state === state) {
            return;
        }

        this._state = state;
        this.stateChanged.dispatch(state);
    }

    stateChanged = new Event<boolean>();
    beforeRead = new Event<this>();
}
