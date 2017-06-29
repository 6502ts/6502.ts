import {Action} from 'redux';

export const actions = {
    runCurrentCartridge: 'cartridge-manager/run-current-cartridge',
    uploadNewCartridge: 'cartridge-manager/upload-new-cartridge',
    selectCartridge: 'cartridge-manager/select-cartridge',
    confirmLoad: 'cartridge-manager/confirm-load',
    confirmSelect: 'cartridge-manager/confirm-select'
};
Object.freeze(actions);

export interface RunCurrentCartridgeAction extends Action {}

export function runCurrentCartridge(): RunCurrentCartridgeAction {
    return {
        type: actions.runCurrentCartridge
    };
}

export interface UploadNewCartridgeAction extends Action {
    file: File;
}

export function uploadNewCartridge(file: File): UploadNewCartridgeAction {
    return {
        type: actions.uploadNewCartridge,
        file
    };
}

export interface SelectCartridgeAction extends Action {
    key: string;
}

export function selectCartridge(key: string): SelectCartridgeAction {
    return {
        type: actions.selectCartridge,
        key
    };
}

export interface ConfirmLoadAction extends Action {
    discardChanges: boolean;
}

export function confirmLoad(discardChanges = false): ConfirmLoadAction {
    return {
        type: actions.confirmLoad,
        discardChanges
    };
}

export interface ConfirmSelectAction extends Action {
    discardChanges: boolean;
}

export function confirmSelect(discardChanges = false): ConfirmSelectAction {
    return {
        type: actions.confirmSelect,
        discardChanges
    };
}
