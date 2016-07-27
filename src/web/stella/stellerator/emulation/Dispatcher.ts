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
