import {Action} from 'redux';

import Settings from '../state/Settings';

import {
    Types,
    InitSettingsAction,
    SetSmoothScalingAction
} from '../actions/settings';

export default function reducer(state: Settings = new Settings(), action: Action): Settings {
    switch (action.type) {
        case Types.setSmoothScaling:
            return setSmoothScaling(state, action as SetSmoothScalingAction);

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
