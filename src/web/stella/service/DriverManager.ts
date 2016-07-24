import EmulationServiceInterface from './EmulationServiceInterface';
import EmulationContextInterface from './EmulationContextInterface';

class DriverManager {

    bind(emulationService: EmulationServiceInterface): this {
        if (this._emulationService) {
            return this;
        }

        this._emulationService = emulationService;

        if (this._emulationService.getState() === EmulationServiceInterface.State.running) {
            this._drivers.forEach(
                driverContext => driverContext.binder(
                    this._emulationService.getEmulationContext(),
                    driverContext.driver
                )
            );
        }

        this._emulationService.stateChanged.addHandler(DriverManager._onEmuStateChange, this);

        return this;
    }

    unbind(): this {
        if (!this._emulationService) {
            return this;
        }

        this._drivers.forEach(
            driverContext => driverContext.driver.unbind()
        );

        this._emulationService.stateChanged.removeHandler(DriverManager._onEmuStateChange, this);

        return this;
    }

    addDriver(driver: DriverManager.Driver, binder: DriverManager.Binder): this {
        this._drivers.set(driver, new DriverManager.DriverContext(driver, binder));

        if (this._emulationService && this._emulationService.getState() === EmulationServiceInterface.State.running) {
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
        switch (newState) {
            case EmulationServiceInterface.State.running:
                self._drivers.forEach(
                    driverContext => driverContext.binder(
                        self._emulationService.getEmulationContext(),
                        driverContext.driver
                    )
                );
                break;

            case EmulationServiceInterface.State.paused:
                break;

            default:
                self._drivers.forEach(
                    driverContext => driverContext.driver.unbind()
                );
                break;
        }
    }

    private _emulationService: EmulationServiceInterface;
    private _drivers = new Map<DriverManager.Driver, DriverManager.DriverContext>();
}

module DriverManager {

    export interface Driver {
        unbind(): void;
    }

    export interface Binder {
        (context: EmulationContextInterface, driver: Driver): void;
    }

    export class DriverContext {
        constructor(
            public driver: Driver,
            public binder: Binder
        ) {}
    }

}

export default DriverManager;
