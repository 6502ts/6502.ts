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

import EmulationServiceInterface from './EmulationServiceInterface';
import EmulationContextInterface from './EmulationContextInterface';

class DriverManager {
    bind(emulationService: EmulationServiceInterface): this {
        if (this._driversBound) {
            return this;
        }

        this._emulationService = emulationService;

        if (this._shouldBindDrivers()) {
            this._bindDrivers();
        }

        this._emulationService.stateChanged.addHandler(DriverManager._onEmuStateChange, this);

        return this;
    }

    unbind(): this {
        if (!this._emulationService) {
            return this;
        }

        this._unbindDrivers();

        this._emulationService.stateChanged.removeHandler(DriverManager._onEmuStateChange, this);

        this._emulationService = null;

        return this;
    }

    addDriver(driver: DriverManager.Driver, binder: DriverManager.Binder): this {
        this._drivers.set(driver, new DriverManager.DriverContext(driver, binder));

        if (this._driversBound) {
            binder(this._emulationService.getEmulationContext(), driver);
        }

        return this;
    }

    removeDriver(driver: DriverManager.Driver): this {
        if (!this._drivers.get(driver)) {
            return this;
        }

        driver.unbind();

        this._drivers.delete(driver);

        return this;
    }

    private static _onEmuStateChange(newState: EmulationServiceInterface.State, self: DriverManager): void {
        if (self._shouldBindDrivers(newState)) {
            self._bindDrivers();
        } else {
            self._unbindDrivers();
        }
    }

    private _shouldBindDrivers(
        state = this._emulationService ? this._emulationService.getState() : undefined
    ): boolean {
        return (
            this._emulationService &&
            (state === EmulationServiceInterface.State.running || state === EmulationServiceInterface.State.paused)
        );
    }

    private _bindDrivers(): void {
        if (this._driversBound) {
            return;
        }

        this._drivers.forEach(driverContext =>
            driverContext.binder(this._emulationService.getEmulationContext(), driverContext.driver)
        );

        this._driversBound = true;
    }

    private _unbindDrivers(): void {
        if (!this._driversBound) {
            return;
        }

        this._drivers.forEach(driverContext => driverContext.driver.unbind());

        this._driversBound = false;
    }

    private _emulationService: EmulationServiceInterface;
    private _drivers = new Map<DriverManager.Driver, DriverManager.DriverContext>();
    private _driversBound = false;
}

namespace DriverManager {
    export interface Driver {
        unbind(): void;
    }

    export interface Binder {
        (context: EmulationContextInterface, driver: Driver): void;
    }

    export class DriverContext {
        constructor(public driver: Driver, public binder: Binder) {}
    }
}

export default DriverManager;
