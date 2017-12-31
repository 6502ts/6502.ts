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

export const actions = {
    runCurrentCartridge: 'cartridge-manager/run-current-cartridge',
    uploadNewCartridge: 'cartridge-manager/upload-new-cartridge',
    selectCartridge: 'cartridge-manager/select-cartridge',
    confirmLoad: 'cartridge-manager/confirm-load',
    confirmSelect: 'cartridge-manager/confirm-select',
    selectRomFromZipfile: 'cartridge-manager/select-rom-from-zipfile'
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

export interface SelectRomFromZipfileAction extends Action {
    filename: string;
}

export function selectRomFromZipfile(filename: string): SelectRomFromZipfileAction {
    return {
        type: actions.selectRomFromZipfile,
        filename
    };
}
