/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
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
import {routerReducer, RouterAction} from 'react-router-redux';

import {
    InitCartridgesAction,
    SelectCartridgeAction,
    RegisterNewCartridgeAction,
    types as ActionType
} from '../actions/root';

import {calculateFromUint8Array as md5sum} from '../../../../tools/hash/md5';

import reduceGuiState from './guiState';
import reduceCurrentCartridge from './currentCartridge';
import reduceEmulationState from './emulation';
import reduceSettings from './settings';
import reduceEnvironment from './environment';
import reduceZipfile from './zipfile';

import State from '../state/State';
import Cartridge from '../model/Cartridge';

import StellaConfig from '../../../../machine/stella/Config';
import CartridgeDetector from '../../../../machine/stella/cartridge/CartridgeDetector';

export default function rootReducer(state: State = new State(), a: Action): State {
    const reducedState = reduce(state, a);

    return new State(
        {
            routing: routerReducer(state.routing, a as RouterAction),
            currentCartridge: reduceCurrentCartridge(reducedState.currentCartridge, a),
            guiState: reduceGuiState(reducedState.guiState, a),
            emulationState: reduceEmulationState(reducedState.emulationState, a),
            settings: reduceSettings(reducedState.settings, a),
            environment: reduceEnvironment(state.environment, a),
            zipfile: reduceZipfile(state.zipfile, a)
        },
        reducedState
    );
}

function reduce(state: State, a: Action): State {
    switch (a.type) {
        case ActionType.deleteCurrentCartridge:
            return deleteCurrentCartridge(state);

        case ActionType.initCartridges:
            return initCartridges(state, a as InitCartridgesAction);

        case ActionType.registerNewCartridge:
            return registerNewCartridge(state, a as RegisterNewCartridgeAction);

        case ActionType.selectCartridge:
            return selectCartridge(state, a as SelectCartridgeAction);

        case ActionType.saveCurrentCartridge:
            return saveCurrentCartride(state);

        default:
            return state;
    }
}

function deleteCurrentCartridge(state: State): State {
    const cartridges: {[key: string]: Cartridge} = {};

    Object.keys(state.cartridges).forEach(
        hash => hash !== state.currentCartridge.hash && (cartridges[hash] = state.cartridges[hash])
    );

    return new State({
        cartridges,
        currentCartridge: null
    }, state);
}

function registerNewCartridge(state: State, a: RegisterNewCartridgeAction): State {
    const buffer = typeof(a.buffer) === 'undefined' ? state.guiState.pendingLoad : a.buffer,
        name = typeof(a.name) === 'undefined' ? state.guiState.pendingLoadName : a.name,
        hash = md5sum(buffer),
        detector = new CartridgeDetector(),
        cartridgeType = detector.detectCartridgeType(buffer);

    let tvMode: StellaConfig.TvMode;

    if (name.match(/\Wpal\W/i)) {
        tvMode = StellaConfig.TvMode.pal;
    }
    else if (name.match(/\Wsecam\W/i)) {
        tvMode = StellaConfig.TvMode.secam;
    }
    else {
        tvMode = StellaConfig.TvMode.ntsc;
    }

    const newCartridge = {
        ...Cartridge.create(),
        name,
        hash,
        tvMode,
        cartridgeType
    };

    return new State({
        currentCartridge: newCartridge
    }, state);
}

function initCartridges(state: State, a: InitCartridgesAction): State {
    const cartridges: {[key: string]: Cartridge} = {};
    a.cartridges.forEach(cartridge => cartridges[cartridge.hash] = cartridge);

    return new State({cartridges}, state);
}

function selectCartridge(state: State, a: SelectCartridgeAction): State {
    const cartridge = state.cartridges[a.hash || state.guiState.pendingSelectHash];

    if (!cartridge) {
        throw new Error(`no cartridge with hash ${a.hash}`);
    }

    return new State({currentCartridge: cartridge}, state);
}

function saveCurrentCartride(state: State): State {
    const cartridges: {[key: string]: Cartridge} = {};

    Object.keys(state.cartridges).forEach(
        key => cartridges[key] = state.cartridges[key]
    );

    cartridges[state.currentCartridge.hash] = state.currentCartridge;

    return new State({cartridges}, state);
}
