import {Action} from 'redux';

import {
    SetModeAction,
    SelectOpenPendingChangesModalAction,
    Type as ActionType,
    LoadOpenPendingChangesModalAction,
} from '../actions/guiState';

import GuiState from '../state/GuiState';

export default function reduce(state: GuiState, action: Action): GuiState {
    switch (action.type) {
        case ActionType.loadOpenPendingChangesModal:
            return loadOpenPendingChangesModal(state, action as LoadOpenPendingChangesModalAction);

        case ActionType.loadClosePendingChangesModal:
            return loadClosePendingChangesModal(state);

        case ActionType.selectClosePendingChangesModal:
            return selectClosePendingChangesModal(state);

        case ActionType.selectOpenPendingChangesModal:
            return selectOpenPendingChangesModal(state, action as SelectOpenPendingChangesModalAction);

        case ActionType.setMode:
            return setMode(state, action as SetModeAction);

        default:
            return state;
    }
}

function setMode(state: GuiState, action: SetModeAction): GuiState {
    return new GuiState({mode: action.guiMode}, state);
}

function selectOpenPendingChangesModal(state: GuiState, action: SelectOpenPendingChangesModalAction): GuiState {
    return new GuiState({
        showSelectPendingChangesModal: true,
        pendingSelectHash: action.pendingSelectHash
    }, state);
}

function selectClosePendingChangesModal(state: GuiState): GuiState {
    return new GuiState({
        showSelectPendingChangesModal: false,
        pendingSelectHash: ''
    }, state);
}

function loadOpenPendingChangesModal(state: GuiState, action: LoadOpenPendingChangesModalAction): GuiState {
    return new GuiState({
        showLoadPendingChangesModal: true,
        pendingLoad: action.pendingLoad,
        pendingLoadName: action.pendingLoadName
    }, state);
}

function loadClosePendingChangesModal(state: GuiState): GuiState {
    return new GuiState({
        showLoadPendingChangesModal: false,
        pendingLoad: null,
        pendingLoadName: ''
    }, state);
}
