import {Action} from 'redux';

import EmulationState from '../state/Emulation';

import {
    Type,
    ChangeDifficultyAction,
    ChangeTvModeAction,
    StartAction,
    StateChangeAction,
    UpdateFrequencyAction,
    UpdateGamepadCountAction,
    SetEnforceRateLimitAction,
} from '../actions/emulation';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';

export default function reducer(state: EmulationState = new EmulationState(), action: Action): EmulationState {
    switch (action.type) {
        case Type.changeDifficulty:
            return changeDifficulty(state, action as ChangeDifficultyAction);

        case Type.changeTvMode:
            return changeTvMode(state, action as ChangeTvModeAction);

        case Type.start:
            return start(state, action as StartAction);

        case Type.stateChange:
            return stateChange(state, action as StateChangeAction);

        case Type.updateFrequency:
            return updateFrequency(state, action as UpdateFrequencyAction);

        case Type.updateGamepadCount:
            return updateGamepadCount(state, action as UpdateGamepadCountAction);

        case Type.setEnforceRateLimit:
            return setEnforceRateLimit(state, action as SetEnforceRateLimitAction);

        case Type.userPause:
            return userPause(state);
    }

    return state;
}

function changeDifficulty(state: EmulationState, action: ChangeDifficultyAction): EmulationState {
    switch (action.player) {
        case 0:
            return new EmulationState({difficultyPlayer0: action.state}, state);

        case 1:
            return new EmulationState({difficultyPlayer1: action.state}, state);

        default:
            throw new Error(`invalid player ${action.player}`);
    }
}

function changeTvMode(state: EmulationState, action: ChangeTvModeAction): EmulationState {
    return new EmulationState({tvMode: action.state}, state);
}

function start(state: EmulationState, action: StartAction): EmulationState {
    return new EmulationState({
        cartridgeHash: action.hash || state.cartridgeHash,
        pausedByUser: false,
    }, state);
}

function stateChange(state: EmulationState, action: StateChangeAction): EmulationState {
    let pausedByUser = state.pausedByUser;

    if (action.newState === EmulationServiceInterface.State.running) {
        pausedByUser = false;
    }

    return new EmulationState({
        emulationState: action.newState,
        pausedByUser
    }, state);
}

function updateFrequency(state: EmulationState, action: UpdateFrequencyAction): EmulationState {
    return new EmulationState({frequency: action.value}, state);
}

function updateGamepadCount(state: EmulationState, action: UpdateGamepadCountAction): EmulationState {
    return new EmulationState({gamepadCount: action.value}, state);
}

function setEnforceRateLimit(state: EmulationState, action: SetEnforceRateLimitAction): EmulationState {
    return new EmulationState({enforceRateLimit: action.enforce}, state);
}

function userPause(state: EmulationState): EmulationState {
    return new EmulationState({pausedByUser: true}, state);
}