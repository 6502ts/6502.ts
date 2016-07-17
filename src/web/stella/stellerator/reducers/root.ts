import {Action} from 'redux';
import {routerReducer} from 'react-router-redux';

import {
    BatchAction,
    DeleteCurrentCartridgeAction,
    GuiStateAction,
    SelectCartridgeAction,
    Type as ActionType
} from '../actions/root';

import reduceGuiState from './guiState';

import State from '../state/State';
import Cartridge from '../state/Cartridge';

export default function rootReducer(state: State, a: Action): State {
    if (a.type === ActionType.batch) {
        return batch(state, a as BatchAction);
    }

    const newState = reduce(state, a);

    newState.routing = routerReducer(state.routing, a);

    return newState;
}

function reduce(state: State, a: Action): State {
    switch (a.type) {
        case ActionType.deleteCurrentCartridge:
            return deleteCurrentCartridge(state, a as DeleteCurrentCartridgeAction);

        case ActionType.guiState:
            return guiState(state, a as GuiStateAction);

        case ActionType.selectCartridge:
            return selectCartridge(state, a as SelectCartridgeAction);

        default:
            return state;
    }
}

function batch(state: State, a: BatchAction): State {
    return a.items.reduce((s: State, action: Action) => rootReducer(s, action), state);
}

function deleteCurrentCartridge(state: State, a: DeleteCurrentCartridgeAction): State {
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

function guiState(state: State, a: GuiStateAction): State {
    return new State(state.cartridges, state.currentCartridge, reduceGuiState(state.guiState, a.action));
}

function selectCartridge(state: State, a: SelectCartridgeAction): State {
    const cartridge = state.cartridges[a.hash];

    if (!cartridge) {
        throw new Error(`no cartridge with hash ${a.hash}`);
    }

    return new State(
        state.cartridges,
        cartridge,
        state.guiState
    );
}
