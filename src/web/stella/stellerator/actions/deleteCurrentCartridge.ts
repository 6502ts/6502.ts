import {Action} from 'redux';

import Type from './type';

export interface DeleteCurrentCartridgeAction extends Action {
    type: Type;
}

export function deleteCurrentCartridge(): DeleteCurrentCartridgeAction {
    return {
        get type(): Type {
            return Type.deleteCurrentCartridge;
        }
    };
}
