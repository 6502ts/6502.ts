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

import {EventInterface} from 'microevent.ts';

import StellaConfig from '../../../machine/stella/Config';
import CartridgeInfo from '../../../machine/stella/cartridge/CartridgeInfo';
import EmulationContextInterface from './EmulationContextInterface';
import {ProcessorConfig as VideoProcessorConfig} from '../../../video/processing/config';

interface EmulationServiceInterface {

    init(): Promise<void>;

    start(
        buffer: {[i: number]: number, length: number},
        config: StellaConfig,
        cartridgeType?: CartridgeInfo.CartridgeType,
        videoProcessing?: Array<VideoProcessorConfig>
    ): Promise<EmulationServiceInterface.State>;

    stop(): Promise<EmulationServiceInterface.State>;

    pause(): Promise<EmulationServiceInterface.State>;

    resume(): Promise<EmulationServiceInterface.State>;

    reset(): Promise<EmulationServiceInterface.State>;

    setRateLimit(enforce: boolean): Promise<void>;

    getRateLimit(): boolean;

    getState(): EmulationServiceInterface.State;

    getLastError(): Error;

    getEmulationContext(): EmulationContextInterface;

    getFrequency(): number;

    stateChanged: EventInterface<EmulationServiceInterface.State>;

    frequencyUpdate: EventInterface<number>;

}

namespace EmulationServiceInterface {

    export enum State {
        stopped,
        running,
        paused,
        error
    }

}

export default EmulationServiceInterface;
