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

import {
    types,
    InitSettingsAction,
    ChangeAudioDriverAction,
    SetSmoothScalingAction,
    SetWebGlRenderingAction,
    SetGammaAction,
    SetUseWorkerAction,
    SetMergeFramesAction,
    SetVolumeAction,
    SetSyncRenderingAction,
    SetPovEmulationAction,
    SetEnableTouchControls,
    SetTouchJoystickSensitivity,
    SetTouchLeftHandedMode,
    ChangeCpuAccuracyAction
} from '../actions/settings';

export default function reducer(settings: Settings = Settings.create(), action: Action): Settings {
    switch (action.type) {
        case types.setSmoothScaling:
            return setSmoothScaling(settings, action as SetSmoothScalingAction);

        case types.setWebGlRendering:
            return setWebGlRendering(settings, action as SetWebGlRenderingAction);

        case types.setPovEmulation:
            return setPovEmulation(settings, action as SetPovEmulationAction);

        case types.setGamma:
            return setGamma(settings, action as SetGammaAction);

        case types.setUseWorker:
            return setUseWorker(settings, action as SetUseWorkerAction);

        case types.init:
            return init(settings, action as InitSettingsAction);

        case types.setMergeFrames:
            return setMergeFrames(settings, action as SetMergeFramesAction);

        case types.setVolume:
            return setVolume(settings, action as SetVolumeAction);

        case types.setSyncRendering:
            return setSyncRendering(settings, action as SetSyncRenderingAction);

        case types.changeAudioDriver:
            return changeAudioDriver(settings, action as ChangeAudioDriverAction);

        case types.changeCpuAccuracy:
            return changeCpuAccuracy(settings, action as ChangeCpuAccuracyAction);

        case types.setEnableTouchControls:
            return setEnableTouchControls(settings, action as SetEnableTouchControls);

        case types.setTouchJoystickSensitivity:
            return setTouchJoystickSensitivity(settings, action as SetTouchJoystickSensitivity);

        case types.setTouchLeftHandedMode:
            return setTouchLeftHandedMode(settings, action as SetTouchLeftHandedMode);
    }

    return settings;
}

function setSmoothScaling(settings: Settings, action: SetSmoothScalingAction): Settings {
    return {
        ...settings,
        smoothScaling: action.value
    };
}

function init(state: Settings, action: InitSettingsAction): Settings {
    return action.settings;
}

function setWebGlRendering(settings: Settings, action: SetWebGlRenderingAction): Settings {
    return {
        ...settings,
        webGlRendering: action.value
    };
}

function setPovEmulation(settings: Settings, action: SetPovEmulationAction): Settings {
    return {
        ...settings,
        povEmulation: action.value
    };
}

function setGamma(settings: Settings, action: SetGammaAction): Settings {
    return Settings.clampGamma({
        ...settings,
        gamma: action.value
    });
}

function setUseWorker(settings: Settings, action: SetUseWorkerAction): Settings {
    return {
        ...settings,
        useWorker: action.value
    };
}

function setMergeFrames(settings: Settings, action: SetMergeFramesAction): Settings {
    return {
        ...settings,
        mergeFrames: action.value
    };
}

function setVolume(settings: Settings, action: SetVolumeAction): Settings {
    const volume = Math.max(Math.min(action.volume, 1), 0);

    return {
        ...settings,
        volume
    };
}

function setSyncRendering(settings: Settings, action: SetSyncRenderingAction): Settings {
    return {
        ...settings,
        syncRendering: action.syncRendering
    };
}

function changeAudioDriver(settings: Settings, action: ChangeAudioDriverAction): Settings {
    return {
        ...settings,
        audioDriver: action.driver
    };
}

function changeCpuAccuracy(settings: Settings, action: ChangeCpuAccuracyAction): Settings {
    return {
        ...settings,
        cpuAccuracy: action.accuracy
    };
}

function setEnableTouchControls(settings: Settings, action: SetEnableTouchControls): Settings {
    return {
        ...settings,
        enableTouchControls: action.enableTouchControls
    };
}

function setTouchJoystickSensitivity(settings: Settings, action: SetTouchJoystickSensitivity): Settings {
    return {
        ...settings,
        touchJoystickSensitivity: action.sensitivity
    };
}

function setTouchLeftHandedMode(settings: Settings, action: SetTouchLeftHandedMode): Settings {
    return {
        ...settings,
        touchLeftHandedMode: action.leftHandedMode
    };
}
