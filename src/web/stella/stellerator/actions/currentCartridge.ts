import {Action} from 'redux';

import StellaConfig from '../../../../machine/stella/Config';

export const Type = {
    changeName: 'current-cartridge/change-name',
    changeTvMode: 'current-cartridge/change-tv-mode'
};
Object.freeze(Type);

export interface ChangeNameAction extends Action {
    name: string;
}

export function changeName(name: string) {
    return {
        type: Type.changeName,
        name
    };
}

export interface ChangeTvModeAction extends Action {
    tvMode: StellaConfig.TvMode;
}

export function changeTvMode(tvMode: StellaConfig.TvMode): ChangeTvModeAction {
    return {
        type: Type.changeTvMode,
        tvMode
    };
}
