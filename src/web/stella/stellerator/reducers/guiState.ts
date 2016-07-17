import {Action} from 'redux';

import {
    SetModeAction,
    Type as ActionType
} from '../actions/guiState';

import GuiState from '../state/GuiState';

export default function reduce(state: GuiState, action: Action): GuiState {
    switch (action.type) {
        case ActionType.setMode:
            return setMode(state, action as SetModeAction);

        default:
            return state;
    }
}

function setMode(state: GuiState, action: SetModeAction): GuiState {
    return new GuiState(action.guiMode);
}
