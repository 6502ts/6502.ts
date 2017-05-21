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

import {
    types as ActionType,
    ChangeCartridgeTypeAction,
    ChangeNameAction,
    ChangeTvModeAction,
    ChangePaddleEmulationAction,
    ChangeRngSeedStrategyAction,
    ChangeRngSeedAction,
    ToggleAudioEnabledAction
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

        case ActionType.toggleAudioEnabled:
            return toggleAudioEnabled(state, action as ToggleAudioEnabledAction);

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

function toggleAudioEnabled(state: Cartridge = new Cartridge(), action: ToggleAudioEnabledAction): Cartridge {
    return new Cartridge({audioEnabled: action.audioEnabled}, state);
}
