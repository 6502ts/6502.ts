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

import StellaConfig from '../../../../../../machine/stella/Config';
import CartridgeInfo from '../../../../../../machine/stella/cartridge/CartridgeInfo';

import CartridgeModel from '../../../model/Cartridge';

type tvModeString = 'pal' | 'secam' | 'ntsc';
type AudioDriverString = 'default' | 'waveform' | 'pcm';
type CpuAccuracyString = 'instruction' | 'cycle' | 'default';

export interface CartridgeSchema {
    id?: number;
    name: string;
    hash: string;
    tvMode: tvModeString;
    cartridgeType: string;
    emulatePaddles: boolean;
    rngSeedAuto: boolean;
    rngSeed: number;
    volume: number;
    frameStart: number;
    autodetectFrameStart: boolean;
    audioDriver: AudioDriverString;
    cpuAccuracy: CpuAccuracyString;
}

function tvModeToString(tvMode: StellaConfig.TvMode): tvModeString {
    switch (tvMode) {
        case StellaConfig.TvMode.ntsc:
            return 'ntsc';

        case StellaConfig.TvMode.pal:
            return 'pal';

        case StellaConfig.TvMode.secam:
            return 'secam';

        default:
            throw new Error(`invalid tv mode ${tvMode}`);
    }
}

function tvModeFromString(modeString: tvModeString): StellaConfig.TvMode {
    switch (modeString) {
        case 'ntsc':
            return StellaConfig.TvMode.ntsc;

        case 'pal':
            return StellaConfig.TvMode.pal;

        case 'secam':
            return StellaConfig.TvMode.secam;

        default:
            throw new Error(`invalid tv mode string ${modeString}`);
    }
}

function audioDriverToString(audioDriver: CartridgeModel.AudioDriver): AudioDriverString {
    switch (audioDriver) {
        case CartridgeModel.AudioDriver.default:
            return 'default';

        case CartridgeModel.AudioDriver.waveform:
            return 'waveform';

        case CartridgeModel.AudioDriver.pcm:
            return 'pcm';

        default:
            throw new Error(`invalid audio driver ${audioDriver}`);
    }
}

function audioDriverFromString(driverString: AudioDriverString): CartridgeModel.AudioDriver {
    switch (driverString) {
        case 'default':
            return CartridgeModel.AudioDriver.default;

        case 'waveform':
            return CartridgeModel.AudioDriver.waveform;

        case 'pcm':
            return CartridgeModel.AudioDriver.pcm;

        default:
            throw new Error(`invalid audio driver string ${driverString}`);
    }
}

function cpuAccuracyToString(cpuAccuracy: CartridgeModel.CpuAccuracy): CpuAccuracyString {
    switch (cpuAccuracy) {
        case CartridgeModel.CpuAccuracy.cycle:
            return 'cycle';

        case CartridgeModel.CpuAccuracy.instruction:
            return 'instruction';

        case CartridgeModel.CpuAccuracy.default:
            return 'default';

        default:
            throw new Error(`invalid CPU accuracy ${cpuAccuracy}`);
    }
}

function cpuAccuracyFromString(cpuAccuracyString: CpuAccuracyString): CartridgeModel.CpuAccuracy {
    switch (cpuAccuracyString) {
        case 'instruction':
            return CartridgeModel.CpuAccuracy.instruction;

        case 'cycle':
            return CartridgeModel.CpuAccuracy.cycle;

        case 'default':
            return CartridgeModel.CpuAccuracy.default;

        default:
            throw new Error(`invalid CPU accuracy string ${cpuAccuracyString}`);
    }
}

export function fromModel(model: CartridgeModel, id?: number): CartridgeSchema {
    const { tvMode, cartridgeType, audioDriver, ...c } = model;

    const cartridge: CartridgeSchema = {
        ...c,
        tvMode: tvModeToString(tvMode),
        cartridgeType: (CartridgeInfo.CartridgeType as any)[cartridgeType],
        audioDriver: audioDriverToString(model.audioDriver),
        cpuAccuracy: cpuAccuracyToString(model.cpuAccuracy)
    };

    if (typeof id !== 'undefined') {
        cartridge.id = id;
    }

    return cartridge;
}

export function toState(cartridge: CartridgeSchema): CartridgeModel {
    const { tvMode, cartridgeType, id, audioDriver, cpuAccuracy, ...c } = cartridge;

    return {
        ...c,
        tvMode: tvModeFromString(tvMode),
        cartridgeType: (CartridgeInfo.CartridgeType as any)[cartridgeType],
        audioDriver: audioDriverFromString(audioDriver),
        cpuAccuracy: cpuAccuracyFromString(cpuAccuracy)
    };
}

export type indexType = number;
