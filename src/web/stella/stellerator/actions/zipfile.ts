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
    set: 'zipfile/set',
    clear: 'zipfile/clear',
    setError: 'zipfile/set-error',
    clearError: 'zipfile/clear-error'
};
Object.freeze(actions);

export interface SetAction extends Action {
    content: Uint8Array;
    candidates: Array<string>;
}

export function set(content: Uint8Array, candidates: Array<string>): SetAction {
    return {
        type: actions.set,
        content,
        candidates
    };
}

export interface ClearAction extends Action {}

export function clear(): ClearAction {
    return {
        type: actions.clear
    };
}

export interface SetErrorAction extends Action {
    message: string;
}

export function setError(message: string): SetErrorAction {
    return {
        type: actions.setError,
        message
    };
}

export interface ClearErrorAction extends Action {}

export function clearError(): ClearErrorAction {
    return {
        type: actions.clearError
    };
}
