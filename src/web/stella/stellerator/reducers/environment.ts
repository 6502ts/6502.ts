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

import Environment from '../state/Environment';

import { types as Actions, InitializeAction } from '../actions/environment';

export default function reducer(state: Environment = new Environment(), action: Action): Environment {
    switch (action.type) {
        case Actions.initialize:
            return initialize(state, action as InitializeAction);

        case Actions.clearWasUpdatedFlag:
            return clearWasUpdatedFlag(state);

        default:
            return state;
    }
}

function initialize(state: Environment, action: InitializeAction): Environment {
    return new Environment(
        {
            helppageUrl: action.helppageUrl,
            buildId: action.buildId,
            wasUpdated: action.wasUpdated
        },
        state
    );
}

function clearWasUpdatedFlag(state: Environment): Environment {
    return new Environment({ wasUpdated: false }, state);
}
