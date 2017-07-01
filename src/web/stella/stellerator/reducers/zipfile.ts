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

import State from '../state/Zipfile';
import {
    actions,
    SetAction,
    SetErrorAction
} from '../actions/zipfile';

export default function reducer(state: State = new State(), action: Action): State {
    switch (action.type) {
        case actions.set:
            return set(state, action as SetAction);

        case actions.clear:
            return clear(state) ;

        case actions.setError:
            return setError(state, action as SetErrorAction);

        case actions.clearError:
            return clearError(state);

        default:
            return state;
    }
}

function set(state: State, action: SetAction): State {
    return new State({
        content: action.content,
        candidateNames: action.candidates
    }, state);
}

function clear(state: State): State {
    return new State({
        content: null,
        candidateNames: []
    }, state);
}

function setError(state: State, action: SetErrorAction): State {
    return new State({error: action.message}, state);
}

function clearError(state: State): State {
    return new State({error: ''}, state);
}
