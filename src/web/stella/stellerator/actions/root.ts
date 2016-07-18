import {Action} from 'redux';

export enum Type {
    selectCartridge,
    deleteCurrentCartridge,
    batch,
    guiState,
    currentCartridge
}

export interface DeleteCurrentCartridgeAction extends Action {
}

export function deleteCurrentCartridge(): DeleteCurrentCartridgeAction {
    return {
        get type(): Type {
            return Type.deleteCurrentCartridge;
        }
    };
}

export interface SelectCartridgeAction extends Action {
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

export interface BatchAction extends Action {
    items: Array<Action>;
}

export function batch(...items: Array<Action>): BatchAction {
    return {
        type: Type.batch,
        items
    };
}

export interface GuiStateAction extends Action {
    action: Action;
}

export function guiState(action: Action): GuiStateAction {
    return {
        type: Type.guiState,
        action
    };
};

export interface CurrentCartridgeAction extends Action {
    action: Action;
}

export function currentCartridge(action: Action) {
    return {
        type: Type.currentCartridge,
        action
    };
}
