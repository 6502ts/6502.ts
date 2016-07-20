import {Action} from 'redux';

import {
    Type as ActionType,
    ChangeNameAction,
    ChangeTvModeAction
} from '../actions/currentCartridge';

import Cartridge from '../state/Cartridge';

export default function reduce(state: Cartridge, action: Action): Cartridge {
    switch (action.type) {
        case ActionType.changeName:
            return changeName(state, action as ChangeNameAction);

        case ActionType.changeTvMode:
            return changeTvMode(state, action as ChangeTvModeAction);

        default:
            return state;
    }
}

function changeName(state: Cartridge, action: ChangeNameAction): Cartridge {
    return new Cartridge(action.name, state.buffer, state.hash, {
        tvMode: state.tvMode,
        cartridgeType: state.cartridgeType
    });
}

function changeTvMode(state: Cartridge, action: ChangeTvModeAction): Cartridge {
    return new Cartridge(state.name, state.buffer, state.hash, {
        tvMode: action.tvMode,
        cartridgeType: state.cartridgeType
    });
}
