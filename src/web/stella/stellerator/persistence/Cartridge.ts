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


import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

import CartridgeState from '../state/Cartridge';

export interface Type {

    id?: number;
    name: string;
    hash: string;
    buffer: Uint8Array;
    tvMode: 'pal'|'secam'|'ntsc';
    cartridgeType: string;
    emulatePaddles: boolean;
    rngSeedAuto: boolean;
    rngSeed: number;
    audioEnabled: boolean;

}

export function fromState(state: CartridgeState, id?: number): Type {
    let tvMode: 'pal'|'ntsc'|'secam';

    switch (state.tvMode) {
        case StellaConfig.TvMode.ntsc:
            tvMode = 'ntsc';
            break;

        case StellaConfig.TvMode.pal:
            tvMode = 'pal';
            break;

        case StellaConfig.TvMode.secam:
            tvMode = 'secam';
            break;

        default:
            throw new Error(`invalid tv mode ${state.tvMode}`);
    }

    const cartridge: Type = {
        name: state.name,
        buffer: state.buffer,
        hash: state.hash,
        emulatePaddles: state.emulatePaddles,
        tvMode,
        cartridgeType: CartridgeInfo.CartridgeType[state.cartridgeType],
        rngSeedAuto: state.rngSeedAuto,
        rngSeed: state.rngSeed,
        audioEnabled: state.audioEnabled
    };

    if (typeof(id) !== 'undefined') {
        cartridge.id = id;
    }

    return cartridge;
}

export function toState(cartridge: Type): CartridgeState {
    let tvMode: StellaConfig.TvMode;

    switch (cartridge.tvMode) {
        case 'ntsc':
            tvMode = StellaConfig.TvMode.ntsc;
            break;

        case 'pal':
            tvMode = StellaConfig.TvMode.pal;
            break;

        case 'secam':
            tvMode = StellaConfig.TvMode.secam;
            break;

        default:
            throw new Error(`invalid tv mode`);
    }

    return new CartridgeState({
        name: cartridge.name,
        buffer: cartridge.buffer,
        hash: cartridge.hash,
        emulatePaddles: cartridge.emulatePaddles,
        tvMode,
        cartridgeType: (CartridgeInfo.CartridgeType as any)[cartridge.cartridgeType],
        rngSeedAuto: cartridge.rngSeedAuto,
        rngSeed: cartridge.rngSeed,
        audioEnabled: cartridge.audioEnabled
    });
}

export type indexType = number;
