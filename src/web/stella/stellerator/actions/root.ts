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
    items: Array<Action|Function>;
}

export function batch(...items: Array<Action|Function>): BatchAction {
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

export function registerNewCartridge(name?: string, buffer?: Uint8Array) {
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
