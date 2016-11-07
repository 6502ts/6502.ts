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

export default class Cartridge implements Changeset {

    constructor(changes?: Changeset, old?: Cartridge) {
        return Object.assign(this, old, changes);
    }

    equals(other: Cartridge): boolean {
        return (
            !!other &&
            this.name === other.name &&
            this.hash === other.hash &&
            this.tvMode === other.tvMode &&
            this.cartridgeType === other.cartridgeType &&
            this.emulatePaddles === other.emulatePaddles &&
            this.rngSeed === other.rngSeed &&
            this.rngSeedAuto === other.rngSeedAuto &&
            this.audioEnabled === other.audioEnabled
        );
    }

    readonly name = '';
    readonly buffer: Uint8Array = null;
    readonly hash = '';
    readonly tvMode = StellaConfig.TvMode.ntsc;
    readonly cartridgeType = CartridgeInfo.CartridgeType.unknown;
    readonly emulatePaddles = true;
    readonly rngSeedAuto = true;
    readonly rngSeed = 0;
    readonly audioEnabled = true;

}

interface Changeset {
    name?: string;
    buffer?: Uint8Array;
    hash?: string;
    tvMode?: StellaConfig.TvMode;
    cartridgeType?: CartridgeInfo.CartridgeType;
    emulatePaddles?: boolean;
    rngSeedAuto?: boolean;
    rngSeed?: number;
    audioEnabled?: boolean;
}
