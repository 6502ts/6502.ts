import {Action} from 'redux';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';

export const Type = {
    start: 'emulation/start',
    pause: 'emulation/pause',
    resume: 'emulation/resume',
    stateChange: 'emulation/stateChange',
    changeDifficulty: 'emulation/changeDifficulty',
    changeTvMode: 'emulation/changeTvMode',
    updateFrequency: 'emulation/updateFrequency',
    updateGamepadCount: 'emuation/updateGamepadCount',
    setEnforceRateLimit: 'emulation/setEnforceRateLimit'
};
Object.freeze(Type);

export interface PauseAction extends Action {}

export function pause(): PauseAction {
    return {
        type: Type.pause
    };
}

export interface StartAction extends Action {
    hash: string;
}

export function start(hash: string = ''): StartAction {
    return {
        type: Type.start,
        hash
    };
}

export interface ResumeAction extends Action {}

export function resume(): ResumeAction {
    return {
        type: Type.resume
    };
}

export interface StateChangeAction extends Action {
    newState: EmulationServiceInterface.State;
}

export function stateChange(newState: EmulationServiceInterface.State): StateChangeAction {
    return {
        type: Type.stateChange,
        newState
    };
}

export interface ChangeDifficultyAction extends Action {
    player: number;
    state: boolean;
}

export function changeDifficulty(player: number, state: boolean): ChangeDifficultyAction {
    return {
        type: Type.changeDifficulty,
        player,
        state
    };
}

export interface ChangeTvModeAction extends Action {
    state: boolean;
}

export function changeTvMode(state: boolean): ChangeTvModeAction {
    return {
        type: Type.changeTvMode,
        state
    };
}

export interface UpdateFrequencyAction extends Action {
    value: number;
}

export function updateFrequency(value: number): UpdateFrequencyAction {
    return {
        type: Type.updateFrequency,
        value
    };
}

export interface UpdateGamepadCountAction extends Action {
    value: number;
};

export function updateGamepadCount(value: number): UpdateGamepadCountAction {
    return {
        type: Type.updateGamepadCount,
        value
    };
}

export interface SetEnforceRateLimitAction extends Action {
    enforce: boolean;
}

export function enforceRateLimit(enforce: boolean): SetEnforceRateLimitAction {
    return {
        type: Type.setEnforceRateLimit,
        enforce
    };
}
