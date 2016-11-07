/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

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
