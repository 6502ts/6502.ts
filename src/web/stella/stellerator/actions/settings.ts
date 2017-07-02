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

import {Action} from 'redux';

import Settings from '../model/Settings';

export const types = {
    setSmoothScaling: 'settings/setSmoothScaling',
    setWebGlRendering: 'settings/setWebGlRendering',
    setGamma: 'settings/setGamma',
    setUseWorker: 'settings/setUseWorker',
    setMergeFrames: 'settings/mergeFrames',
    init: 'settings/init'
};

export interface SetSmoothScalingAction extends Action {
    value: boolean;
}

export function setSmoothScaling(value: boolean): SetSmoothScalingAction {
    return {
        type: types.setSmoothScaling,
        value
    };
}

export interface InitSettingsAction extends Action {
    settings: Settings;
}

export function initSettings(settings: Settings): InitSettingsAction {
    return {
        type: types.init,
        settings
    };
}

export interface SetWebGlRenderingAction extends Action {
    value: boolean;
}

export function setWebGlRendering(value: boolean): SetWebGlRenderingAction {
    return {
        type: types.setWebGlRendering,
        value
    };
}

export interface SetGammaAction extends Action {
    value: number;
}

export function setGamma(value: number): SetGammaAction {
    return {
        type: types.setGamma,
        value
    };
}

export interface SetUseWorkerAction extends Action {
    value: boolean;
}

export function setUseWorker(value: boolean): SetUseWorkerAction {
    return {
        type: types.setUseWorker,
        value
    };
}

export interface SetMergeFramesAction extends Action {
    value: boolean;
}

export function setMergeFrames(value: boolean): SetMergeFramesAction {
    return {
        type: types.setMergeFrames,
        value
    };
}

export function isSettingsChange(a: Action): boolean {
    return a.type.indexOf('settings/') === 0 && a.type !== types.init;
}
