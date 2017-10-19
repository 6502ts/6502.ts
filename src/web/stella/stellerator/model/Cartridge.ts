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

import StellaConfig from '../../../../machine/stella/Config';
import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';

interface Cartridge {
    name: string;
    hash: string;
    tvMode: StellaConfig.TvMode;
    cartridgeType: CartridgeInfo.CartridgeType;
    emulatePaddles: boolean;
    rngSeedAuto: boolean;
    rngSeed: number;
    volume: number;
}

namespace Cartridge {
    export function create(): Cartridge {
        return {
            name: '',
            hash: '',
            tvMode: StellaConfig.TvMode.ntsc,
            cartridgeType: CartridgeInfo.CartridgeType.unknown,
            emulatePaddles: true,
            rngSeedAuto: true,
            rngSeed: 0,
            volume: 1
        };
    }

    export function equals(c1: Cartridge, c2: Cartridge) {
        return (
            !!c1 &&
            !!c2 &&
            c1.name === c2.name &&
            c1.hash === c2.hash &&
            c1.tvMode === c2.tvMode &&
            c1.cartridgeType === c2.cartridgeType &&
            c1.emulatePaddles === c2.emulatePaddles &&
            c1.rngSeedAuto === c2.rngSeedAuto &&
            c1.rngSeed === c2.rngSeed &&
            c1.volume === c2.volume
        );
    }
}

export default Cartridge;
