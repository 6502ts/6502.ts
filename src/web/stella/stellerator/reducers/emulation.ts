/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import { Action } from 'redux';

import EmulationState from '../state/Emulation';

import {
    types,
    ChangeDifficultyAction,
    ChangeTvModeAction,
    StartAction,
    StateChangeAction,
    UpdateFrequencyAction,
    UpdateGamepadCountAction,
    SetEnforceRateLimitAction
} from '../actions/emulation';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';

export default function reducer(state: EmulationState = new EmulationState(), action: Action): EmulationState {
    switch (action.type) {
        case types.changeDifficulty:
            return changeDifficulty(state, action as ChangeDifficultyAction);

        case types.changeTvMode:
            return changeTvMode(state, action as ChangeTvModeAction);

        case types.start:
            return start(state, action as StartAction);

        case types.stateChange:
            return stateChange(state, action as StateChangeAction);

        case types.updateFrequency:
            return updateFrequency(state, action as UpdateFrequencyAction);

        case types.updateGamepadCount:
            return updateGamepadCount(state, action as UpdateGamepadCountAction);

        case types.setEnforceRateLimit:
            return setEnforceRateLimit(state, action as SetEnforceRateLimitAction);

        case types.userPause:
            return userPause(state);
    }

    return state;
}

function changeDifficulty(state: EmulationState, action: ChangeDifficultyAction): EmulationState {
    switch (action.player) {
        case 0:
            return new EmulationState({ difficultyPlayer0: action.state }, state);

        case 1:
            return new EmulationState({ difficultyPlayer1: action.state }, state);

        default:
            throw new Error(`invalid player ${action.player}`);
    }
}

function changeTvMode(state: EmulationState, action: ChangeTvModeAction): EmulationState {
    return new EmulationState({ tvMode: action.state }, state);
}

function start(state: EmulationState, action: StartAction): EmulationState {
    return new EmulationState(
        {
            cartridge: action.cartridge || state.cartridge,
            pausedByUser: false
        },
        state
    );
}

function stateChange(state: EmulationState, action: StateChangeAction): EmulationState {
    let pausedByUser = state.pausedByUser;

    if (action.newState === EmulationServiceInterface.State.running) {
        pausedByUser = false;
    }

    return new EmulationState(
        {
            emulationState: action.newState,
            pausedByUser
        },
        state
    );
}

function updateFrequency(state: EmulationState, action: UpdateFrequencyAction): EmulationState {
    return new EmulationState({ frequency: action.value }, state);
}

function updateGamepadCount(state: EmulationState, action: UpdateGamepadCountAction): EmulationState {
    return new EmulationState({ gamepadCount: action.value }, state);
}

function setEnforceRateLimit(state: EmulationState, action: SetEnforceRateLimitAction): EmulationState {
    return new EmulationState({ enforceRateLimit: action.enforce }, state);
}

function userPause(state: EmulationState): EmulationState {
    return new EmulationState({ pausedByUser: true }, state);
}
