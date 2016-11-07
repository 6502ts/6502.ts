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

import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

export const Type = {
    changeCartridgeType: 'current-cartridge/change-cartridge-type',
    changeName: 'current-cartridge/change-name',
    changeTvMode: 'current-cartridge/change-tv-mode',
    changePaddleEmulation: 'current-cartridge/change-paddle-emulation',
    changeRngSeedStrategy: 'current-cartridge/change-rng-seed-strateg',
    changeRngSeed: 'current-cartridge/change-rng-seed',
    toggleAudioEnabled: 'current-cartridge/toggle-audio-enabled'
};
Object.freeze(Type);

export interface ChangeNameAction extends Action {
    name: string;
}

export function changeName(name: string) {
    return {
        type: Type.changeName,
        name
    };
}

export interface ChangeTvModeAction extends Action {
    tvMode: StellaConfig.TvMode;
}

export function changeTvMode(tvMode: StellaConfig.TvMode): ChangeTvModeAction {
    return {
        type: Type.changeTvMode,
        tvMode
    };
}

export interface ChangeCartridgeTypeAction extends Action {
    cartridgeType: CartridgeInfo.CartridgeType;
}

export function changeCartridgeType(cartridgeType: CartridgeInfo.CartridgeType): ChangeCartridgeTypeAction {
    return {
        type: Type.changeCartridgeType,
        cartridgeType
    };
}

export interface ChangePaddleEmulationAction extends Action {
    emulatePaddles: boolean;
}

export function changePaddleEmulation(emulatePaddles: boolean): ChangePaddleEmulationAction {
    return {
        type: Type.changePaddleEmulation,
        emulatePaddles
    };
}

export interface ChangeRngSeedStrategyAction extends Action {
    auto: boolean;
}

export function changeRngSeedStrategy(auto: boolean): ChangeRngSeedStrategyAction {
    return {
        type: Type.changeRngSeedStrategy,
        auto
    };
}

export interface ChangeRngSeedAction extends Action {
    seed: number;
}

export function changeRngSeed(seed: number): ChangeRngSeedAction {
    return {
        type: Type.changeRngSeed,
        seed
    };
}

export interface ToggleAudioEnabledAction extends Action {
    audioEnabled: boolean;
}

export function toggleAudioEnabled(audioEnabled: boolean): ToggleAudioEnabledAction {
    return {
        type: Type.toggleAudioEnabled,
        audioEnabled
    };
}