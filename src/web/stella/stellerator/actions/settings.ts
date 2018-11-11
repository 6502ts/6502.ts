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

import Settings from '../model/Settings';

export const types = {
    setSmoothScaling: 'settings/setSmoothScaling',
    setWebGlRendering: 'settings/setWebGlRendering',
    setPovEmulation: 'settings/setPovEmulation',
    setGamma: 'settings/setGamma',
    setUseWorker: 'settings/setUseWorker',
    setMergeFrames: 'settings/mergeFrames',
    setVolume: 'settings/setVolume',
    setSyncRendering: 'settings/setSyncRendering',
    changeAudioDriver: 'settings/changeAudioDriver',
    changeCpuAccuracy: 'settings/changeCpuAccuracy',
    setEnableTouchControls: 'settings/setEnableTouchControls',
    setTouchJoystickSensitivity: 'settings/setTouchJoystickSensitivity',
    setTouchLeftHandedMode: 'settings/setTouchLeftHandedMode',
    init: 'settings/init'
};

export function isSettingsChange(a: Action): boolean {
    return a.type.indexOf('settings/') === 0 && a.type !== types.init;
}

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

export interface SetPovEmulationAction extends Action {
    value: boolean;
}

export function setPovEmulation(value: boolean): SetPovEmulationAction {
    return {
        type: types.setPovEmulation,
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

export interface SetVolumeAction extends Action {
    volume: number;
}

export function setVolume(volume: number): SetVolumeAction {
    return {
        type: types.setVolume,
        volume
    };
}

export interface SetSyncRenderingAction extends Action {
    syncRendering: boolean;
}

export function setSyncRendering(syncRendering: boolean): SetSyncRenderingAction {
    return {
        type: types.setSyncRendering,
        syncRendering
    };
}

export interface ChangeAudioDriverAction extends Action {
    driver: Settings.AudioDriver;
}

export function changeAudioDriver(driver: Settings.AudioDriver): ChangeAudioDriverAction {
    return {
        type: types.changeAudioDriver,
        driver
    };
}

export interface ChangeCpuAccuracyAction extends Action {
    accuracy: Settings.CpuAccuracy;
}

export function changeCpuAccuracy(accuracy: Settings.CpuAccuracy): ChangeCpuAccuracyAction {
    return {
        type: types.changeCpuAccuracy,
        accuracy
    };
}

export interface SetEnableTouchControls extends Action {
    enableTouchControls: boolean;
}

export function setEnableTouchControls(enableTouchControls: boolean): SetEnableTouchControls {
    return {
        type: types.setEnableTouchControls,
        enableTouchControls
    };
}

export interface SetTouchJoystickSensitivity extends Action {
    sensitivity: number;
}

export function setTouchJoystickSensitivity(sensitivity: number): SetTouchJoystickSensitivity {
    return {
        type: types.setTouchJoystickSensitivity,
        sensitivity
    };
}

export interface SetTouchLeftHandedMode extends Action {
    leftHandedMode: boolean;
}

export function setTouchLeftHandedMode(leftHandedMode: boolean): SetTouchLeftHandedMode {
    return {
        type: types.setTouchLeftHandedMode,
        leftHandedMode
    };
}
