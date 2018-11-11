/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
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

import deepEqual = require('deep-equal');

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
    frameStart: number;
    autodetectFrameStart: boolean;
    audioDriver: Cartridge.AudioDriver;
    cpuAccuracy: Cartridge.CpuAccuracy;
}

namespace Cartridge {
    export const enum AudioDriver {
        default,
        waveform,
        pcm
    }

    export const enum CpuAccuracy {
        default,
        instruction,
        cycle
    }

    export function create(): Cartridge {
        return {
            name: '',
            hash: '',
            tvMode: StellaConfig.TvMode.ntsc,
            cartridgeType: CartridgeInfo.CartridgeType.unknown,
            emulatePaddles: true,
            rngSeedAuto: true,
            rngSeed: 0,
            volume: 1,
            frameStart: 0,
            autodetectFrameStart: true,
            audioDriver: AudioDriver.default,
            cpuAccuracy: CpuAccuracy.default
        };
    }

    export function equals(c1: Cartridge, c2: Cartridge) {
        return !!c1 && !!c2 && deepEqual(c1, c2, { strict: true });
    }
}

export { Cartridge as default };
