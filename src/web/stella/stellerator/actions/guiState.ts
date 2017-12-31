/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import { Action } from 'redux';

import { GuiMode } from '../model/types';

export const types = {
    setMode: 'gui-state/set-mode',
    selectOpenPendingChangesModal: 'gui-state/select-open-pending-changes-modal',
    selectClosePendingChangesModal: 'gui-state/select-close-pending-changes-modal',
    applyPendingChanges: 'gui-state/apply-pending-changes',
    loadOpenPendingChangesModal: 'gui-state/upload-open-pending-changes-modal',
    loadClosePendingChangesModal: 'gui-state/upload-close-pending-changes-modal',
    finishPendingUpload: 'gui-state/finish-pending-upload'
};
Object.freeze(types);

export interface SetModeAction extends Action {
    guiMode: GuiMode;
}

export function setMode(guiMode: GuiMode) {
    return {
        type: types.setMode,
        guiMode
    };
}

export interface OpenSelectPendingChangesModalAction extends Action {
    pendingSelectHash: string;
}

export function openSelectPendingChangesModal(pendingSelectHash: string): OpenSelectPendingChangesModalAction {
    return {
        type: types.selectOpenPendingChangesModal,
        pendingSelectHash
    };
}

export interface CloseSelectPendingChangesModalAction extends Action {}

export function closeSelectPendingChangesModal(): CloseSelectPendingChangesModalAction {
    return {
        type: types.selectClosePendingChangesModal
    };
}

export interface OpenLoadPendingChangesModalAction extends Action {
    pendingLoad: Uint8Array;
    pendingLoadName: string;
}

export function openLoadPendingChangesModal(
    pendingLoad: Uint8Array,
    pendingLoadName: string
): OpenLoadPendingChangesModalAction {
    return {
        type: types.loadOpenPendingChangesModal,
        pendingLoad,
        pendingLoadName
    };
}

export interface CloseLoadPendingChangesModalAction extends Action {}

export function closeLoadPendingChangesModal(): CloseLoadPendingChangesModalAction {
    return {
        type: types.loadClosePendingChangesModal
    };
}
