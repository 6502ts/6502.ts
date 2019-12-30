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

export { DriverManager as default };
