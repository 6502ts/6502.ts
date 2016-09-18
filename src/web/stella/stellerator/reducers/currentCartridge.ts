import {Action} from 'redux';

import {
    Type as ActionType,
    ChangeCartridgeTypeAction,
    ChangeNameAction,
    ChangeTvModeAction,
    ChangePaddleEmulationAction,
    ChangeRngSeedStrategyAction,
    ChangeRngSeedAction
} from '../actions/currentCartridge';

import Cartridge from '../state/Cartridge';

export default function reduce(state: Cartridge, action: Action): Cartridge {
    switch (action.type) {
        case ActionType.changeCartridgeType:
            return changeCartridgeType(state, action as ChangeCartridgeTypeAction);

        case ActionType.changeName:
            return changeName(state, action as ChangeNameAction);

        case ActionType.changeTvMode:
            return changeTvMode(state, action as ChangeTvModeAction);

        case ActionType.changePaddleEmulation:
            return changePaddleEmulation(state, action as ChangePaddleEmulationAction);

        case ActionType.changeRngSeedStrategy:
            return changeRngSeedStrategy(state, action as ChangeRngSeedStrategyAction);

        case ActionType.changeRngSeed:
            return changeRngSeed(state, action as ChangeRngSeedAction);

        default:
            return state;
    }
}

function changeName(state: Cartridge = new Cartridge(), action: ChangeNameAction): Cartridge {
    return new Cartridge({name: action.name}, state);
}

function changeTvMode(state: Cartridge = new Cartridge(), action: ChangeTvModeAction): Cartridge {
    return new Cartridge({tvMode: action.tvMode}, state);
}

function changeCartridgeType(state: Cartridge = new Cartridge(), action: ChangeCartridgeTypeAction): Cartridge {
    return new Cartridge({cartridgeType: action.cartridgeType}, state);
}

function changePaddleEmulation(state: Cartridge = new Cartridge(), action: ChangePaddleEmulationAction): Cartridge {
    return new Cartridge({emulatePaddles: action.emulatePaddles}, state);
}

function changeRngSeedStrategy(state: Cartridge = new Cartridge(), action: ChangeRngSeedStrategyAction): Cartridge {
    return new Cartridge({rngSeedAuto: action.auto}, state);
}

function changeRngSeed(state: Cartridge = new Cartridge(), action: ChangeRngSeedAction): Cartridge {
    return new Cartridge({rngSeed: action.seed}, state);
}