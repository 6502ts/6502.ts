import {Action} from 'redux';

export const Type = {
    batch                       : 'batch',
    deleteCurrentCartridge      : 'delete-current-cartridge',
    selectCartridge             : 'select-cartridge',
    saveCurrentCartridge        : 'save-current-cartridge'
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

export interface SaveCurrentCartridgeAction extends Action {}

export function saveCurrentCartride(): SaveCurrentCartridgeAction {
    return {
        type: Type.saveCurrentCartridge
    };
}
