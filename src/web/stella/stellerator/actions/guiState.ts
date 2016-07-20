import {Action} from 'redux';

import GuiState from '../state/GuiState';

export const Type = {
    setMode: 'gui-state/set-mode',
    selectOpenPendingChangesModal: 'gui-state/select-open-pending-changes-modal',
    selectClosePendingChangesModal: 'gui-state/select-close-pending-changes-modal',
    applyPendingChanges: 'gui-state/apply-pending-changes',
    loadOpenPendingChangesModal: 'gui-state/upload-open-pending-changes-modal',
    loadClosePendingChangesModal: 'gui-state/upload-close-pending-changes-modal',
    finishPendingUpload: 'gui-state/finish-pending-upload'
};
Object.freeze(Type);

export interface SetModeAction extends Action {
    guiMode: GuiState.GuiMode;
}

export function setMode(guiMode: GuiState.GuiMode) {
    return {
        type: Type.setMode,
        guiMode
    };
}

export interface SelectOpenPendingChangesModalAction extends Action {
    pendingSelectHash: string;
}

export function selectOpenPendingChangesModal(pendingSelectHash: string): SelectOpenPendingChangesModalAction {
    return {
        type: Type.selectOpenPendingChangesModal,
        pendingSelectHash
    };
}

export interface SelectClosePendingChangesModalAction extends Action {};

export function selectClosePendingChangesModal(): SelectClosePendingChangesModalAction {
    return {
        type: Type.selectClosePendingChangesModal
    };
}

export interface LoadOpenPendingChangesModalAction extends Action {
    pendingLoad: Uint8Array;
    pendingLoadName: string;
}

export function loadOpenPendingChangesModal(pendingLoad: Uint8Array, pendingLoadName: string): LoadOpenPendingChangesModalAction {
    return {
        type: Type.loadOpenPendingChangesModal,
        pendingLoad,
        pendingLoadName
    };
}

export interface LoadClosePendingChangesModalAction extends Action {}

export function loadClosePendingChangesModal(): LoadClosePendingChangesModalAction {
    return {
        type: Type.loadClosePendingChangesModal
    };
}
