import {Store} from 'redux';

import {stateChange} from '../actions/emulation';
import EmulationServiceInterface from '../../service/EmulationServiceInterface';

export default class Dispatcher<S> {

    constructor(private _store: Store<S>) {}

    bind(emulationService: EmulationServiceInterface): void {
        this._emulationService = emulationService;
        this._emulationService.stateChanged.addHandler(Dispatcher._dispatch, this);

        Dispatcher._dispatch(undefined, this);
    }

    unbind(): void {
        this._emulationService.stateChanged.removeHandler(Dispatcher._dispatch, this);
        this._emulationService = null;
    }

    private static _dispatch(newState: EmulationServiceInterface.State, self: Dispatcher<any>) {
        self._store.dispatch(stateChange(self._emulationService.getState()));
    }

    private _emulationService: EmulationServiceInterface;
}
