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

import CartridgeInfo from './CartridgeInfo';
import Cpuinterface from '../../cpu/CpuInterface';
import BusInterface from '../../bus/BusInterface';

import RngInterface from '../../../tools/rng/GeneratorInterface';

interface CartridgeInterface {

    reset(): void;

    read(address: number): number;

    peek(address: number): number;

    write(address: number, value: number): void;

    getType(): CartridgeInfo.CartridgeType;

    setCpu(cpu: Cpuinterface): this;

    setBus(bus: BusInterface): this;

    notifyCpuCycleComplete(): void;

    randomize(rng: RngInterface): void;

    trap: EventInterface<CartridgeInterface.TrapPayload>;

}

module CartridgeInterface {

    export const enum TrapReason {invalidRead, invalidWrite}

    export class TrapPayload {
        constructor(
            public reason: TrapReason,
            public cartridge: CartridgeInterface,
            public message?: string
        ) {}
    }
}

export default CartridgeInterface;
