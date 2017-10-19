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

import { Action } from 'redux';

import {
    ChangeCartridgeTypeAction,
    ChangeNameAction,
    ChangePaddleEmulationAction,
    ChangeRngSeedAction,
    ChangeRngSeedStrategyAction,
    ChangeTvModeAction,
    ChangeVolumeAction,
    ChangeFrameStartAction,
    ChangeFrameStartAutoAction,
    ChangeUsePcmAudioAction,
    types as ActionType
} from '../actions/currentCartridge';
import Cartridge from '../model/Cartridge';

export default function reduce(cartridge: Cartridge, action: Action): Cartridge {
    switch (action.type) {
        case ActionType.changeCartridgeType:
            return changeCartridgeType(cartridge, action as ChangeCartridgeTypeAction);

        case ActionType.changeName:
            return changeName(cartridge, action as ChangeNameAction);

        case ActionType.changeTvMode:
            return changeTvMode(cartridge, action as ChangeTvModeAction);

        case ActionType.changePaddleEmulation:
            return changePaddleEmulation(cartridge, action as ChangePaddleEmulationAction);

        case ActionType.changeRngSeedStrategy:
            return changeRngSeedStrategy(cartridge, action as ChangeRngSeedStrategyAction);

        case ActionType.changeRngSeed:
            return changeRngSeed(cartridge, action as ChangeRngSeedAction);

        case ActionType.changeVolume:
            return changeVolume(cartridge, action as ChangeVolumeAction);

        case ActionType.changeFrameStart:
            return changeFrameStart(cartridge, action as ChangeFrameStartAction);

        case ActionType.changeFrameStartAuto:
            return changeFrameStartAuto(cartridge, action as ChangeFrameStartAutoAction);

        case ActionType.changeUsePcmAudio:
            return changeUsePcmAudio(cartridge, action as ChangeUsePcmAudioAction);

        default:
            return cartridge;
    }
}

function changeName(cartridge: Cartridge = Cartridge.create(), action: ChangeNameAction): Cartridge {
    return {
        ...cartridge,
        name: action.name
    };
}

function changeTvMode(cartridge: Cartridge = Cartridge.create(), action: ChangeTvModeAction): Cartridge {
    return {
        ...cartridge,
        tvMode: action.tvMode
    };
}

function changeCartridgeType(cartridge: Cartridge = Cartridge.create(), action: ChangeCartridgeTypeAction): Cartridge {
    return {
        ...cartridge,
        cartridgeType: action.cartridgeType
    };
}

function changePaddleEmulation(
    cartridge: Cartridge = Cartridge.create(),
    action: ChangePaddleEmulationAction
): Cartridge {
    return {
        ...cartridge,
        emulatePaddles: action.emulatePaddles
    };
}

function changeRngSeedStrategy(
    cartridge: Cartridge = Cartridge.create(),
    action: ChangeRngSeedStrategyAction
): Cartridge {
    return {
        ...cartridge,
        rngSeedAuto: action.auto
    };
}

function changeRngSeed(cartridge: Cartridge = Cartridge.create(), action: ChangeRngSeedAction): Cartridge {
    return {
        ...cartridge,
        rngSeed: action.seed
    };
}

function changeVolume(cartridge: Cartridge = Cartridge.create(), action: ChangeVolumeAction): Cartridge {
    const volume = Math.max(Math.min(action.volume, 1), 0);

    return {
        ...cartridge,
        volume
    };
}

function changeFrameStart(cartridge: Cartridge = Cartridge.create(), action: ChangeFrameStartAction): Cartridge {
    return {
        ...cartridge,
        frameStart: action.frameStart
    };
}

function changeFrameStartAuto(
    cartridge: Cartridge = Cartridge.create(),
    action: ChangeFrameStartAutoAction
): Cartridge {
    return {
        ...cartridge,
        autodetectFrameStart: action.frameStartAuto
    };
}

function changeUsePcmAudio(cartridge: Cartridge = Cartridge.create(), action: ChangeUsePcmAudioAction): Cartridge {
    return {
        ...cartridge,
        pcmAudio: action.usePcmAudio
    };
}
