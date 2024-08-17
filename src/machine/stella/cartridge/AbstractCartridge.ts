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

import { Event } from 'microevent.ts';

import CartridgeInterface from './CartridgeInterface';
import CpuInterface from '../../cpu/CpuInterface';
import Bus from '../Bus';

import RngInterface from '../../../tools/rng/GeneratorInterface';
import { CartridgeType } from './CartridgeInfo';

class AbstractCartridge implements CartridgeInterface {
    async init(): Promise<void> {}

    reset(): void {}

    read(address: number): number {
        return 0;
    }

    peek(address: number): number {
        return this.read(address);
    }

    write(address: number, value: number) {}

    getType(): CartridgeType {
        return CartridgeType.unknown;
    }

    setCpu(cpu: CpuInterface): this {
        return this;
    }

    setBus(bus: Bus): this {
        return this;
    }

    setRng(rng: RngInterface): this {
        return this;
    }

    setCpuTimeProvider(provider: () => number) {
        return this;
    }

    notifyCpuCycleComplete(): void {}

    randomize(rng: RngInterface): void {}

    protected triggerTrap(reason: CartridgeInterface.TrapReason, message: string) {
        if (this.trap.hasHandlers) {
            this.trap.dispatch(new CartridgeInterface.TrapPayload(reason, this, message));
        } else {
            throw new Error(message);
        }
    }

    trap = new Event<CartridgeInterface.TrapPayload>();
}

export { AbstractCartridge as default };
