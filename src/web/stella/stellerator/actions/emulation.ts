import {Action} from 'redux';

export const Type = {
    start: 'emulation/start',
    pause: 'emulation/pause',
    resume: 'emulation/resume'
};
Object.freeze(Type);

export interface PauseAction extends Action {}

export function pause(): PauseAction {
    return {
        type: Type.pause
    };
}

export interface StartAction extends Action {}

export function start(): StartAction {
    return {
        type: Type.start
    };
}

export interface ResumeAction extends Action {}

export function resume(): ResumeAction {
    return {
        type: Type.resume
    };
}
