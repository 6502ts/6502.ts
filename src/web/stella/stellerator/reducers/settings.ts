import {Action} from 'redux';

import Settings from '../state/Settings';

import {
    Types,
    InitSettingsAction,
    SetSmoothScalingAction,
    SetWebGlRenderingAction,
    SetGammaAction
} from '../actions/settings';

export default function reducer(state: Settings = new Settings(), action: Action): Settings {
    switch (action.type) {
        case Types.setSmoothScaling:
            return setSmoothScaling(state, action as SetSmoothScalingAction);

        case Types.setWebGlRendering:
            return setWebGlRendering(state, action as SetWebGlRenderingAction);

        case Types.setGamma:
            return setGamma(state, action as SetGammaAction);

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
