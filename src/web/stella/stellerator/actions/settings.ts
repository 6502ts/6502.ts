import {Action} from 'redux';

import Settings from '../state/Settings';

export const Types = {
    setSmoothScaling: 'settings/setSmoothScaling',
    setWebGlRendering: 'settings/setWebGlRendering',
    setGamma: 'settings/setGamma',
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

export interface SetWebGlRenderingAction extends Action {
    value: boolean;
}

export function setWebGlRendering(value: boolean): SetWebGlRenderingAction {
    return {
        type: Types.setWebGlRendering,
        value
    };
}

export interface SetGammaAction extends Action {
    value: number;
}

export function setGamma(value: number): SetGammaAction {
    return {
        type: Types.setGamma,
        value
    };
}

export function isSettingsChange(a: Action): boolean {
    return a.type.indexOf('settings/') === 0 && a.type !== Types.init;
}
