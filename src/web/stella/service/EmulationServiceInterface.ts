/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import { EventInterface } from 'microevent.ts';

import StellaConfig from '../../../machine/stella/Config';
import CartridgeInfo from '../../../machine/stella/cartridge/CartridgeInfo';
import EmulationContextInterface from './EmulationContextInterface';

interface EmulationServiceInterface {
    init(): Promise<void>;

    start(
        buffer: { [i: number]: number; length: number },
        config: EmulationServiceInterface.Config,
        cartridgeType?: CartridgeInfo.CartridgeType
    ): Promise<EmulationServiceInterface.State>;

    stop(): Promise<EmulationServiceInterface.State>;

    pause(): Promise<EmulationServiceInterface.State>;

    resume(): Promise<EmulationServiceInterface.State>;

    reset(): Promise<EmulationServiceInterface.State>;

    peek(index: number): Promise<number>;

    poke(index: number, value: number): Promise<void>;

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
        stopped = 'stopped',
        running = 'running',
        paused = 'paused',
        error = 'error'
    }

    export interface Config extends StellaConfig {
        asyncIO?: boolean;
    }
}

export { EmulationServiceInterface as default };
