import {Action} from 'redux';
import {routerReducer} from 'react-router-redux';

import {
    BatchAction,
    InitCartridgesAction,
    SelectCartridgeAction,
    RegisterNewCartridgeAction,
    Type as ActionType
} from '../actions/root';

import {calculateFromUint8Array as md5sum} from '../../../../tools/hash/md5';

import reduceGuiState from './guiState';
import reduceCurrentCartridge from './currentCartridge';

import State from '../state/State';
import Cartridge from '../state/Cartridge';

import StellaConfig from '../../../../machine/stella/Config';
import CartridgeDetector from '../../../../machine/stella/cartridge/CartridgeDetector';

export default function rootReducer(state: State = new State(), a: Action): State {
    if (a.type === ActionType.batch) {
        return batch(state, a as BatchAction);
    }

    const newState = reduce(state, a);

    newState.routing = routerReducer(state.routing, a);
    newState.currentCartridge = reduceCurrentCartridge(newState.currentCartridge, a);
    newState.guiState = reduceGuiState(newState.guiState, a);

    return newState;
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
            return new State(state.cartridges, state.currentCartridge, state.guiState);
    }
}

function batch(state: State, a: BatchAction): State {
    return a.items.reduce((s: State, action: Action) => rootReducer(s, action), state);
}

function deleteCurrentCartridge(state: State): State {
    const cartridges: {[key: string]: Cartridge} = {};

    Object.keys(state.cartridges).forEach(
        hash => hash !== state.currentCartridge.hash && (cartridges[hash] = state.cartridges[hash])
    );

    return new State(
        cartridges,
        null,
        state.guiState
    );
}

function registerNewCartridge(state: State, a: RegisterNewCartridgeAction): State {
    const hash = md5sum(a.buffer),
        detector = new CartridgeDetector(),
        cartridgeType = detector.detectCartridgeType(a.buffer);

    let tvMode: StellaConfig.TvMode;

    if (a.name.match(/\Wpal\W/i)) {
        tvMode = StellaConfig.TvMode.pal;
    }
    else if (a.name.match(/\Wsecam\W/i)) {
        tvMode = StellaConfig.TvMode.secam;
    }
    else {
        tvMode = StellaConfig.TvMode.ntsc;
    }

    const newCartridge = new Cartridge(
        a.name,
        a.buffer,
        hash, {
            tvMode,
            cartridgeType
        }
    );

    return new State(state.cartridges, newCartridge, state.guiState);
}

function initCartridges(state: State, a: InitCartridgesAction): State {
    const cartridges: {[key: string]: Cartridge} = {};
    a.cartridges.forEach(cartridge => cartridges[cartridge.hash] = cartridge);

    return new State(cartridges, undefined, state.guiState);
}

function selectCartridge(state: State, a: SelectCartridgeAction): State {
    const cartridge = state.cartridges[a.hash || state.guiState.pendingSelectHash];

    if (!cartridge) {
        throw new Error(`no cartridge with hash ${a.hash}`);
    }

    return new State(
        state.cartridges,
        cartridge,
        state.guiState
    );
}

function saveCurrentCartride(state: State): State {
    const cartridges: {[key: string]: Cartridge} = {};

    Object.keys(state.cartridges).forEach(
        key => cartridges[key] = state.cartridges[key]
    );

    cartridges[state.currentCartridge.hash] = state.currentCartridge;

    return new State(
        cartridges,
        state.currentCartridge,
        state.guiState
    );
}