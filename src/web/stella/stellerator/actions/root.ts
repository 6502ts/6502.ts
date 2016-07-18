import {Action} from 'redux';

export const Type = {
    selectCartridge             : 'SELECT-CARTRIDGE',
    deleteCurrentCartridge      : 'DELETE-CURRENT-CARTRIDGE',
    batch                       : 'BATCH'
};
Object.freeze(Type);

export interface DeleteCurrentCartridgeAction extends Action {
}

export function deleteCurrentCartridge(): DeleteCurrentCartridgeAction {
    return {
        type: Type.deleteCurrentCartridge
    };
}

export interface SelectCartridgeAction extends Action {
    hash: string;
}

export function selectCartridge(hash: string): SelectCartridgeAction {
    return {
        hash: hash,

        type: Type.selectCartridge
    };
}

export interface BatchAction extends Action {
    items: Array<Action>;
}

export function batch(...items: Array<Action>): BatchAction {
    return {
        type: Type.batch,
        items
    };
}
