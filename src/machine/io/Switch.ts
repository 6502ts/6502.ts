import SwitchInterface from './SwitchInterface';
import Event from '../../tools/event/Event';

export default class Switch implements SwitchInterface {

    constructor(private _state: boolean = false) {}

    read(): boolean {
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
}
