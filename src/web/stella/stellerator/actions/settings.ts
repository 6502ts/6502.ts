import {Action} from 'redux';

import Settings from '../state/Settings';

export const Types = {
    setSmoothScaling: 'settings/setSmoothScaling',
    init: 'settings/init'
};

export interface SetSmoothScalingAction extends Action {
    value: boolean;
}

export function setSmoothScaling(value: boolean): SetSmoothScalingAction {
    return {
        type: Types.setSmoothScaling,
        value
    };
}

export interface InitSettingsAction extends Action {
    settings: Settings;
};

export function initSettings(settings: Settings): InitSettingsAction {
    return {
        type: Types.init,
        settings
    };
}

export function isSettingsChange(a: Action): boolean {
    return a.type.indexOf('settings/') === 0 && a.type !== Types.init;
}
