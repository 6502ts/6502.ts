import {Action} from 'redux';

import Type from './type';

export interface SelectCartridgeAction extends Action {
    type: Type;
    hash: string;
}

export function selectCartridge(hash: string): SelectCartridgeAction {
    return {
        hash: hash,

        get type(): Type {
            return Type.selectCartridge;
        }
    };
}
