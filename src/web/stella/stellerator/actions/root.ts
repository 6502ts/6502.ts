import {Action} from 'redux';

import Cartridge from '../state/Cartridge';

export const Type = {
    batch                       : 'batch',
    deleteCurrentCartridge      : 'delete-current-cartridge',
    initCartridges              : 'init-cartridges',
    registerNewCartridge        : 'register-new-cartridge',
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

export function selectCartridge(hash: string = ''): SelectCartridgeAction {
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

export interface RegisterNewCartridgeAction extends Action {
    buffer: Uint8Array;
    name: string;
}

export function registerNewCartridge(name: string, buffer: Uint8Array) {
    return {
        type: Type.registerNewCartridge,
        name,
        buffer
    };
}

export interface InitCartridgesAction extends Action {
    cartridges: Array<Cartridge>;
}

export function initCartridges(cartridges: Array<Cartridge>): InitCartridgesAction {
    return {
        type: Type.initCartridges,
        cartridges
    };
}
