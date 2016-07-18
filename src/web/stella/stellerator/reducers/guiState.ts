import {Action} from 'redux';

import {
    SetModeAction,
    OpenPendingChangesModalAction,
    Type as ActionType
} from '../actions/guiState';

import GuiState from '../state/GuiState';

export default function reduce(state: GuiState, action: Action): GuiState {
    switch (action.type) {
        case ActionType.closePendingChangesModal:
            return closePendingChangesModal(state);

        case ActionType.openPendingChangesModal:
            return openPendingChangesModal(state, action as OpenPendingChangesModalAction);

        case ActionType.setMode:
            return setMode(state, action as SetModeAction);

        default:
            return state;
    }
}

function setMode(state: GuiState, action: SetModeAction): GuiState {
    return new GuiState(action.guiMode);
}

function openPendingChangesModal(state: GuiState, action: OpenPendingChangesModalAction): GuiState {
    return new GuiState(
        state.mode,
        true,
        action.pendingSelectHash
    );
}

function closePendingChangesModal(state: GuiState): GuiState {
    return new GuiState(
        state.mode,
        false,
        ''
    );
}
