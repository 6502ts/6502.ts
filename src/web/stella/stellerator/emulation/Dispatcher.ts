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


import {Store} from 'redux';

import {
    stateChange,
    updateFrequency
} from '../actions/emulation';
import EmulationServiceInterface from '../../service/EmulationServiceInterface';

export default class Dispatcher<S> {

    constructor(private _store: Store<S>) {}

    bind(emulationService: EmulationServiceInterface): void {
        this._emulationService = emulationService;
        this._emulationService.stateChanged.addHandler(Dispatcher._dispatchStateChange, this);
        this._emulationService.frequencyUpdate.addHandler(Dispatcher._dispatchFrequencyUpdate, this);

        Dispatcher._dispatchStateChange(undefined, this);
    }

    unbind(): void {
        this._emulationService.stateChanged.removeHandler(Dispatcher._dispatchStateChange, this);
        this._emulationService.frequencyUpdate.removeHandler(Dispatcher._dispatchFrequencyUpdate, this);
        this._emulationService = null;
    }

    private static _dispatchStateChange(newState: EmulationServiceInterface.State, self: Dispatcher<any>) {
        self._store.dispatch(stateChange(self._emulationService.getState()));
    }

    private static _dispatchFrequencyUpdate(frequency: number, self: Dispatcher<any>) {
        self._store.dispatch(updateFrequency(frequency));
    }

    private _emulationService: EmulationServiceInterface;
}
