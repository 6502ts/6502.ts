import {Action} from 'redux';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';

export const Type = {
    start: 'emulation/start',
    pause: 'emulation/pause',
    resume: 'emulation/resume',
    stateChange: 'emulation/stateChange'
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
