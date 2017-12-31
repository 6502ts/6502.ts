/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import EmulationServiceInterface from '../../service/EmulationServiceInterface';
import Cartridge from '../model/Cartridge';

export const types = {
    start: 'emulation/start',
    pause: 'emulation/pause',
    userPause: 'emulation/user-pause',
    resume: 'emulation/resume',
    reset: 'emulation/reset',
    stateChange: 'emulation/state-change',
    changeDifficulty: 'emulation/change-difficulty',
    changeTvMode: 'emulation/change-tv-mode',
    updateFrequency: 'emulation/update-frequency',
    updateGamepadCount: 'emuation/update-gamepad-count',
    setEnforceRateLimit: 'emulation/set-enforce-rate_lLimit'
};
Object.freeze(types);

export interface PauseAction extends Action {}

export function pause(): PauseAction {
    return {
        type: types.pause
    };
}

export interface UserPauseAction extends Action {}

export function userPause(): UserPauseAction {
    return {
        type: types.userPause
    };
}

export interface StartAction extends Action {
    cartridge: Cartridge;
}

export function start(cartridge: Cartridge = null): StartAction {
    return {
        type: types.start,
        cartridge
    };
}

export interface ResumeAction extends Action {}

export function resume(): ResumeAction {
    return {
        type: types.resume
    };
}

export interface ResetAction extends Action {}

export function reset(): ResetAction {
    return {
        type: types.reset
    };
}

export interface StateChangeAction extends Action {
    newState: EmulationServiceInterface.State;
}

export function stateChange(newState: EmulationServiceInterface.State): StateChangeAction {
    return {
        type: types.stateChange,
        newState
    };
}

export interface ChangeDifficultyAction extends Action {
    player: number;
    state: boolean;
}

export function changeDifficulty(player: number, state: boolean): ChangeDifficultyAction {
    return {
        type: types.changeDifficulty,
        player,
        state
    };
}

export interface ChangeTvModeAction extends Action {
    state: boolean;
}

export function changeTvMode(state: boolean): ChangeTvModeAction {
    return {
        type: types.changeTvMode,
        state
    };
}

export interface UpdateFrequencyAction extends Action {
    value: number;
}

export function updateFrequency(value: number): UpdateFrequencyAction {
    return {
        type: types.updateFrequency,
        value
    };
}

export interface UpdateGamepadCountAction extends Action {
    value: number;
}

export function updateGamepadCount(value: number): UpdateGamepadCountAction {
    return {
        type: types.updateGamepadCount,
        value
    };
}

export interface SetEnforceRateLimitAction extends Action {
    enforce: boolean;
}

export function enforceRateLimit(enforce: boolean): SetEnforceRateLimitAction {
    return {
        type: types.setEnforceRateLimit,
        enforce
    };
}
