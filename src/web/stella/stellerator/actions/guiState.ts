import {Action} from 'redux';

import GuiState from '../state/GuiState';

export const Type = {
    setMode: 'gui-state/set-mode',
    openPendingChangesModal: 'gui-state/open-pending-changes-modal',
    closePendingChangesModal: 'gui-state/close-pending-changes-modal',
    applyPendingChanges: 'gui-state/apply-pending-changes'

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

export interface OpenPendingChangesModalAction extends Action {
    pendingSelectHash: string;
}

export function openPendingChangesModal(pendingSelectHash: string): OpenPendingChangesModalAction {
    return {
        type: Type.openPendingChangesModal,
        pendingSelectHash
    };
}

export interface ClosePendingChangesModalAction extends Action {};

export function closePendingChangesModal(): ClosePendingChangesModalAction {
    return {
        type: Type.closePendingChangesModal
    };
}
