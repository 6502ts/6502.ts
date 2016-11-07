/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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

import Settings from '../state/Settings';

import {
    Types,
    InitSettingsAction,
    SetSmoothScalingAction,
    SetWebGlRenderingAction,
    SetGammaAction,
    SetUseWorkerAction
} from '../actions/settings';

export default function reducer(state: Settings = new Settings(), action: Action): Settings {
    switch (action.type) {
        case Types.setSmoothScaling:
            return setSmoothScaling(state, action as SetSmoothScalingAction);

        case Types.setWebGlRendering:
            return setWebGlRendering(state, action as SetWebGlRenderingAction);

        case Types.setGamma:
            return setGamma(state, action as SetGammaAction);

        case Types.setUseWorker:
            return setUseWorker(state, action as SetUseWorkerAction);

        case Types.init:
            return init(state, action as InitSettingsAction);
    }

    return state;
}

function setSmoothScaling(state: Settings, action: SetSmoothScalingAction): Settings {
    return new Settings({smoothScaling: action.value}, state);
}

function init(state: Settings, action: InitSettingsAction): Settings {
    return action.settings;
}

function setWebGlRendering(state: Settings, action: SetWebGlRenderingAction): Settings {
    return new Settings({webGlRendering: action.value}, state);
}

function setGamma(state: Settings, action: SetGammaAction): Settings {
    return new Settings({gamma: action.value}, state);
}

function setUseWorker(state: Settings, action: SetUseWorkerAction): Settings {
    return new Settings({useWorker: action.value}, state);
}
