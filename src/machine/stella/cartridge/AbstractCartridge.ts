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

import { Event } from 'microevent.ts';

import CartridgeInterface from './CartridgeInterface';
import CartridgeInfo from './CartridgeInfo';
import CpuInterface from '../../cpu/CpuInterface';
import Bus from '../Bus';

import RngInterface from '../../../tools/rng/GeneratorInterface';

class AbstractCartridge implements CartridgeInterface {
    reset(): void {}

    read(address: number): number {
        return 0;
    }

    peek(address: number): number {
        return this.read(address);
    }

    write(address: number, value: number) {}

    getType(): CartridgeInfo.CartridgeType {
        return CartridgeInfo.CartridgeType.unknown;
    }

    setCpu(cpu: CpuInterface): this {
        return this;
    }

    setBus(bus: Bus): this {
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

export default AbstractCartridge;
