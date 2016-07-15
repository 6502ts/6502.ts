import {Action} from 'redux';

import {SelectCartridgeAction} from '../actions/selectCartridge';
import {DeleteCurrentCartridgeAction} from '../actions/deleteCurrentCartridge';
import ActionType from '../actions/type';
import State from '../state/State';
import Cartridge from '../state/Cartridge';

export default function reduce(state: State, a: Action): State {
    switch (a.type) {
        case ActionType.selectCartridge:
            return selectCartridge(state, a as SelectCartridgeAction);

        case ActionType.deleteCurrentCartridge:
            return deleteCurrentCartridge(state, a as DeleteCurrentCartridgeAction);

        default:
            return state;
    }
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
