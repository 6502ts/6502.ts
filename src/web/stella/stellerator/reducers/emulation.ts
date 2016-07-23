import {Action} from 'redux';

import EmulationState from '../state/Emulation';

import {
    Type,
    StartAction,
    StateChangeAction
} from '../actions/emulation';

export default function reducer(state: EmulationState = new EmulationState(), action: Action): EmulationState {
    switch (action.type) {
        case Type.start:
            return start(state, action as StartAction);

        case Type.stateChange:
            return stateChange(state, action as StateChangeAction);
    }

    return state;
}

function start(state: EmulationState, action: StartAction): EmulationState {
    return new EmulationState({cartridgeHash: action.hash || state.cartridgeHash}, state);
}

function stateChange(state: EmulationState, action: StateChangeAction): EmulationState {
    return new EmulationState({emulationState: action.newState}, state);
}
