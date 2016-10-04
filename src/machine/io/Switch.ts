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
