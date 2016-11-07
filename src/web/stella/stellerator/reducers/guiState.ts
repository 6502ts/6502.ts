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

import {
    SetModeAction,
    SelectOpenPendingChangesModalAction,
    Type as ActionType,
    LoadOpenPendingChangesModalAction,
} from '../actions/guiState';

import GuiState from '../state/GuiState';

export default function reduce(state: GuiState = new GuiState(), action: Action): GuiState {
    switch (action.type) {
        case ActionType.loadOpenPendingChangesModal:
            return loadOpenPendingChangesModal(state, action as LoadOpenPendingChangesModalAction);

        case ActionType.loadClosePendingChangesModal:
            return loadClosePendingChangesModal(state);

        case ActionType.selectClosePendingChangesModal:
            return selectClosePendingChangesModal(state);

        case ActionType.selectOpenPendingChangesModal:
            return selectOpenPendingChangesModal(state, action as SelectOpenPendingChangesModalAction);

        case ActionType.setMode:
            return setMode(state, action as SetModeAction);

        default:
            return state;
    }
}

function setMode(state: GuiState, action: SetModeAction): GuiState {
    return new GuiState({mode: action.guiMode}, state);
}

function selectOpenPendingChangesModal(state: GuiState, action: SelectOpenPendingChangesModalAction): GuiState {
    return new GuiState({
        showSelectPendingChangesModal: true,
        pendingSelectHash: action.pendingSelectHash
    }, state);
}

function selectClosePendingChangesModal(state: GuiState): GuiState {
    return new GuiState({
        showSelectPendingChangesModal: false,
        pendingSelectHash: ''
    }, state);
}

function loadOpenPendingChangesModal(state: GuiState, action: LoadOpenPendingChangesModalAction): GuiState {
    return new GuiState({
        showLoadPendingChangesModal: true,
        pendingLoad: action.pendingLoad,
        pendingLoadName: action.pendingLoadName
    }, state);
}

function loadClosePendingChangesModal(state: GuiState): GuiState {
    return new GuiState({
        showLoadPendingChangesModal: false,
        pendingLoad: null,
        pendingLoadName: ''
    }, state);
}
